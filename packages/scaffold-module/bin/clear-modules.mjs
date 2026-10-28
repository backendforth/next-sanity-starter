#!/usr/bin/env node
// @ts-check
/**
 * Clears the page stack before a project builds its own modules: `modules[]` then offers
 * nothing, and the first `pnpm gen:module <Name>` is its only entry.
 *
 * Usage:
 *   pnpm clear:modules [--dry-run]
 *
 *   --dry-run  Print what would change without writing.
 *
 * A module that rich text embeds (`richTextMedia`, AGENTS.md → "Inline modules") stays, inline
 * only: it leaves the page-stack slots. Every other module goes, with its schema, component and
 * GROQ projection, and the files in `web/src/components/modules/` that only it imports. The
 * slots are those of `@repo/check-wiring/manifest`, the ones `pnpm check:wiring` reads. Every
 * change is computed first; if any slot is missing nothing is written. The touched files are
 * formatted with Biome at the end.
 *
 * Meant for the start of a project: content that already holds a deleted module shows it as an
 * unknown type in the Studio. Then run `pnpm generate`, `pnpm check:wiring` and
 * `pnpm typecheck`. `--root <dir>` targets another checkout (tests).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

import {
	moduleNamesFromId,
	rootFromArgv,
	wiringSlots,
} from "@repo/check-wiring/manifest";

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const root = rootFromArgv(argv);
const wiring = wiringSlots(root);

/** @param {string} p */
const rel = (p) => relative(root, p);

// ── Plan every change in memory ────────────────────────────────────────────
/** @type {Map<string, { after: string; label: string }>} */
const plan = new Map();
/** @type {Set<string>} */
const deletions = new Set();

/** The planned source of a file, else the one on disk. @param {string} file */
async function source(file) {
	return plan.get(file)?.after ?? (await readFile(file, "utf8"));
}

/**
 * Drops top-level `const`s and named imports that a removal left unused, e.g. a row preview
 * only a deleted `moduleTypes` entry used.
 *
 * @param {string} text
 */
function pruneUnused(text) {
	let out = text;
	/** @param {string} name */
	const uses = (name) =>
		out.match(new RegExp(`\\b${name}\\b`, "g"))?.length ?? 0;
	for (let changed = true; changed; ) {
		changed = false;
		for (const m of out.matchAll(/^const (\w+) = [^\n]*;\n/gm)) {
			if (uses(m[1] ?? "") === 1) {
				out = out.replace(m[0], "");
				changed = true;
				break;
			}
		}
		if (changed) continue;
		for (const m of out.matchAll(
			/^import (type )?\{([^}]*)\} from ("[^"]+");\n/gm,
		)) {
			const names = (m[2] ?? "")
				.split(",")
				.map((name) => name.trim())
				.filter(Boolean);
			const used = names.filter(
				(name) =>
					uses(
						name
							.replace(/^type /, "")
							.split(/\s+as\s+/)
							.at(-1) ?? "",
					) > 1,
			);
			if (used.length === names.length) continue;
			out = out.replace(
				m[0],
				used.length
					? `import ${m[1] ?? ""}{ ${used.join(", ")} } from ${m[3]};\n`
					: "",
			);
			changed = true;
			break;
		}
	}
	return out;
}

/** Every `.ts`/`.tsx` file under `dir`. @param {string} dir @returns {Promise<string[]>} */
async function sourceFiles(dir) {
	if (!existsSync(dir)) return [];
	const entries = await readdir(dir, { withFileTypes: true, recursive: true });
	return entries
		.filter(
			(e) =>
				e.isFile() && /\.tsx?$/.test(e.name) && !e.name.endsWith(".gen.ts"),
		)
		.map((e) => join(e.parentPath, e.name))
		.filter((file) => !/\/(node_modules|\.next)\//.test(file));
}

/**
 * Files in the components folder whose every importer is gone, repeated until none is left:
 * the deleted modules' helpers (lists, client halves, lazy wrappers).
 */
async function orphanedComponents() {
	const dir = wiring.files.componentDir;
	const web = join(root, "web");
	const candidates = (await sourceFiles(dir)).filter((f) => !deletions.has(f));
	/** @type {Map<string, Set<string>>} */
	const importers = new Map(candidates.map((f) => [f, new Set()]));
	const byStem = new Map(candidates.map((f) => [f.replace(/\.tsx?$/, ""), f]));
	/* Deleted files count as importers too: a helper only they import is the orphan to find. */
	for (const file of await sourceFiles(web)) {
		const text = await source(file);
		for (const m of text.matchAll(
			/(?:from\s+|import\(\s*)"((?:\.{1,2}|@)\/[^"]+)"/g,
		)) {
			const spec = m[1] ?? "";
			const target = spec.startsWith("@/")
				? join(web, spec.slice(2))
				: resolve(dirname(file), spec);
			const hit = byStem.get(target.replace(/\.tsx?$/, ""));
			if (hit && hit !== file) importers.get(hit)?.add(file);
		}
	}
	/** @type {string[]} */
	const orphans = [];
	for (let found = true; found; ) {
		found = false;
		for (const [file, from] of importers) {
			if (deletions.has(file) || from.size === 0) continue;
			if ([...from].every((f) => deletions.has(f))) {
				deletions.add(file);
				orphans.push(file);
				found = true;
			}
		}
	}
	return orphans;
}

/** @type {string[]} */
let dropped = [];
/** @type {string[]} */
let inlineOnly = [];
/** @type {string[]} */
let orphans = [];

try {
	const [schemaIndex] = wiring.required;
	const [inlineSchema] = wiring.inline;
	if (!schemaIndex || !inlineSchema) throw new Error("wiring manifest changed");
	const registered = schemaIndex.read(await source(schemaIndex.file));
	const inline = inlineSchema.read(await source(inlineSchema.file));
	dropped = [...registered].filter((id) => !inline.has(id));
	inlineOnly = [...registered].filter((id) => inline.has(id));

	/* A deleted module that a kept one embeds (`of: [{ type: "module.x" }]`) would break it. */
	for (const id of inlineOnly) {
		const schema = wiring.moduleFiles(moduleNamesFromId(id)).schema;
		const text = existsSync(schema) ? await readFile(schema, "utf8") : "";
		const used = dropped.find((other) => text.includes(`type: "${other}"`));
		if (used) {
			throw new Error(
				`${id} stays inline but embeds ${used}, which isn't inline. Make ${used} inline first.`,
			);
		}
	}

	/** @param {import("@repo/check-wiring/manifest").ListSlot} slot @param {string} id */
	const removeFrom = async (slot, id) => {
		const before = await source(slot.file);
		if (!slot.read(before).has(id)) return;
		const after = slot.remove(before, moduleNamesFromId(id));
		if (slot.read(after).has(id)) {
			throw new Error(`${rel(slot.file)}: removing ${id} did not take it out`);
		}
		const label = plan.get(slot.file)?.label;
		plan.set(slot.file, {
			after,
			label:
				!label || label.includes(slot.label)
					? slot.label
					: `${label}; ${slot.label}`,
		});
	};

	for (const id of [...dropped, ...inlineOnly]) {
		for (const slot of wiring.page) await removeFrom(slot, id);
	}
	for (const id of dropped) {
		for (const slot of wiring.required) await removeFrom(slot, id);
		for (const file of Object.values(
			wiring.moduleFiles(moduleNamesFromId(id)),
		)) {
			if (existsSync(file)) deletions.add(file);
		}
	}
	for (const [file, change] of plan) {
		plan.set(file, { ...change, after: pruneUnused(change.after) });
	}
	orphans = await orphanedComponents();
} catch (error) {
	console.error(
		`error: ${/** @type {Error} */ (error).message}\nNothing was written.`,
	);
	process.exit(1);
}

if (plan.size === 0 && deletions.size === 0) {
	console.log("The page stack is empty already. Nothing to clear.");
	process.exit(0);
}

const summary = [
	dropped.length ? `deleted: ${dropped.join(", ")}` : "",
	inlineOnly.length ? `inline only: ${inlineOnly.join(", ")}` : "",
]
	.filter(Boolean)
	.join("\n");

if (dryRun) {
	for (const [file, change] of plan) {
		console.log(`would patch   ${rel(file)} (${change.label})`);
	}
	for (const file of deletions) {
		console.log(
			`would delete  ${rel(file)}${orphans.includes(file) ? " (only the deleted modules import it)" : ""}`,
		);
	}
	console.log(`\n${summary}\n\nDry run — nothing written.`);
	process.exit(0);
}

// ── Write ──────────────────────────────────────────────────────────────────
for (const [file, change] of plan) {
	await writeFile(file, change.after, "utf8");
	console.log(`patched  ${rel(file)} (${change.label})`);
}
for (const file of deletions) {
	await rm(file);
	console.log(`deleted  ${rel(file)}`);
}

/* Relative paths: Biome matches its `studio/**` override (2-space indent) against them. */
const format = spawnSync(
	"pnpm",
	["exec", "biome", "check", "--write", ...[...plan.keys()].map(rel)],
	{ cwd: root, stdio: "ignore" },
);
if (format.status !== 0) {
	console.warn(
		"warn: Biome could not format the touched files; run `pnpm format`.",
	);
}

console.log(`
${summary}

The page stack is empty: \`modules[]\` offers no module until \`pnpm gen:module <Name>\` adds one.
Content that already holds a deleted module shows it as an unknown type in the Studio.
Next:
  pnpm generate        # schema + TypeGen without the deleted modules
  pnpm check:wiring
  pnpm typecheck`);
