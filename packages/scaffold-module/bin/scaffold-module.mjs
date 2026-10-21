#!/usr/bin/env node
// @ts-check
/**
 * Scaffolds a new content module and wires it everywhere.
 *
 * Usage:
 *   pnpm gen:module <Name> [--dry-run] [--inline]
 *
 *   <Name>     PascalCase module name (e.g. "Hero", "Quote", "VideoStrip").
 *   --dry-run  Print what would change without writing.
 *   --inline   Also make it insertable inside rich text: the Studio's `richTextMedia` `of`,
 *              `richTextMediaQuery` and the `types` map in `portableTextComponents.tsx`.
 *              Off by default — only for modules that make sense inline.
 *
 * Creates the schema, component and GROQ projection from `templates/` and adds the module to
 * every list slot in `@repo/check-wiring/manifest` (the same slots `pnpm check:wiring`
 * reads), `ModulesRenderer`'s switch included. Every change is computed first; if any anchor
 * is missing nothing is written. The touched files are formatted with Biome at the end.
 *
 * Then run `pnpm generate` (the module's type is `ModuleOf<"module.<id>">` from TypeGen),
 * `pnpm check:wiring` and `pnpm typecheck`. `--root <dir>` targets another checkout (tests).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import {
	moduleNames,
	rootFromArgv,
	wiringSlots,
} from "@repo/check-wiring/manifest";

const templatesDir = fileURLToPath(new URL("../templates", import.meta.url));

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const inline = argv.includes("--inline");
const root = rootFromArgv(argv);
const rawName = argv.find(
	(arg, i) => !arg.startsWith("--") && argv[i - 1] !== "--root",
);

if (!rawName) {
	console.error(
		"usage: pnpm gen:module <PascalCaseName> [--dry-run] [--inline]",
	);
	process.exit(2);
}
if (!/^[A-Z][A-Za-z0-9]+$/.test(rawName)) {
	console.error(
		`error: name must be PascalCase (got "${rawName}"). Examples: Hero, Quote, VideoStrip.`,
	);
	process.exit(2);
}

const mod = moduleNames(rawName);
const wiring = wiringSlots(root);
/** @param {string} p */
const rel = (p) => relative(root, p);

// ── Plan every change in memory ────────────────────────────────────────────
/** @type {Map<string, { created: boolean; after: string; label: string }>} */
const plan = new Map();

/** @param {string} name */
async function fromTemplate(name) {
	const template = await readFile(join(templatesDir, name), "utf8");
	return template
		.replaceAll("__MODULE_NAME__", mod.id)
		.replaceAll("__MODULE_TITLE__", mod.pascal)
		.replaceAll("__MODULE_VAR__", mod.schemaVar)
		.replaceAll("__MODULE_QUERY_VAR__", mod.queryVar)
		.replaceAll("__MODULE_COMPONENT__", mod.component);
}

try {
	const owned = wiring.moduleFiles(mod);
	for (const [file, template, label] of /** @type {const} */ ([
		[owned.schema, "schema.ts.tmpl", "studio schema"],
		[owned.component, "component.tsx.tmpl", "web component"],
		[owned.query, "query.ts.tmpl", "GROQ projection"],
	])) {
		if (existsSync(file)) {
			throw new Error(
				`${rel(file)} already exists — is ${mod.id} wired already?`,
			);
		}
		plan.set(file, {
			created: true,
			after: await fromTemplate(template),
			label,
		});
	}

	for (const slot of [
		...wiring.required,
		...wiring.page,
		...(inline ? wiring.inline : []),
	]) {
		const current = plan.get(slot.file);
		const source = current?.after ?? (await readFile(slot.file, "utf8"));
		if (slot.read(source).has(mod.id)) {
			throw new Error(`${rel(slot.file)} already lists ${mod.id}`);
		}
		const after = slot.insert(source, mod);
		if (!slot.read(after).has(mod.id)) {
			throw new Error(
				`${rel(slot.file)}: inserting ${mod.id} did not register it`,
			);
		}
		plan.set(slot.file, {
			created: current?.created ?? false,
			after,
			label: current ? `${current.label}; ${slot.label}` : slot.label,
		});
	}
} catch (error) {
	console.error(
		`error: ${/** @type {Error} */ (error).message}\nNothing was written.`,
	);
	process.exit(1);
}

if (dryRun) {
	for (const [file, change] of plan) {
		console.log(
			`${change.created ? "would create" : "would patch "}  ${rel(file)} (${change.label})`,
		);
	}
	console.log("\nDry run — nothing written.");
	process.exit(0);
}

// ── Write ──────────────────────────────────────────────────────────────────
for (const [file, change] of plan) {
	await writeFile(file, change.after, "utf8");
	console.log(
		`${change.created ? "created" : "patched"}  ${rel(file)} (${change.label})`,
	);
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
${mod.id} is wired${inline ? " (inline too)" : ""}. Next:
  pnpm generate        # schema + TypeGen; ${mod.component} reads ModuleOf<"${mod.id}">
  pnpm check:wiring
  pnpm typecheck`);
