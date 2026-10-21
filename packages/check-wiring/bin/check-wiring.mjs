#!/usr/bin/env node
// @ts-check
/**
 * Validates the module wiring documented in AGENTS.md ("The module pattern").
 *
 * Usage:
 *   pnpm check:wiring
 *
 * Every `module.<id>` schema under studio/schemas/objects/modules/ must have its component and
 * GROQ projection file and an entry in the schema index. The page stack and inline use are two
 * groups of slots in `src/manifest.mjs`, each all or none: `moduleTypes`, the `ModulesRenderer`
 * switch and `modulesQuery` for a module in a document's `modules[]`; the Studio's
 * `richTextMedia` `of`, `richTextMediaQuery` and the `types` map in `portableTextComponents.tsx`
 * for a module inside rich text. Every module is in at least one of the two groups. Being a field
 * or array member type of another module (a carousel's slides) does not count: the parent
 * projects it to its own shape, so the module keeps no type of its own and its component can't
 * compile. A slot that lists a module without a schema is stale and fails too.
 *
 * The module's TS type is not a wiring point: it is `ModuleOf<"module.<id>">` from the
 * generated query types, and `tsc` checks its fields and the renderer's `never` fallback.
 *
 * Exits 1 with a report when anything drifts. Pass `--root <dir>` to check another checkout
 * (the tooling tests do).
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import { moduleNames, rootFromArgv, wiringSlots } from "../src/manifest.mjs";

const root = rootFromArgv(process.argv);
const wiring = wiringSlots(root);
/** @param {string} p */
const rel = (p) => relative(root, p);

/** @type {Map<string, string[]>} module id → findings */
const perModule = new Map();
/** @type {string[]} */
const general = [];
/** @param {string} id @param {string} finding */
const fail = (id, finding) =>
	perModule.set(id, [...(perModule.get(id) ?? []), finding]);

// ── Modules: one schema file each ──────────────────────────────────────────
/** @type {Map<string, ReturnType<typeof moduleNames>>} */
const modules = new Map();
/** Modules another module's schema takes as a field or array member type. */
const nested = new Set();
const schemaFiles = (await readdir(wiring.files.schemaDir)).filter((f) =>
	/^module\w+\.ts$/.test(f),
);
for (const file of schemaFiles) {
	const source = await readFile(join(wiring.files.schemaDir, file), "utf8");
	const name = /name:\s*"(module\.\w+)"/.exec(source)?.[1];
	const exported = /export const (module\w+)\s*=\s*defineType\(/.exec(
		source,
	)?.[1];
	if (!name || !exported) {
		general.push(
			`${rel(join(wiring.files.schemaDir, file))}: no \`name: "module.<id>"\` or \`export const module<Name> = defineType(\``,
		);
		continue;
	}
	const mod = moduleNames(exported.replace(/^module/, ""));
	if (mod.id !== name || `${mod.schemaVar}.ts` !== file) {
		general.push(
			`${rel(join(wiring.files.schemaDir, file))}: file, export and name must match (\`${mod.schemaVar}.ts\`, \`${mod.schemaVar}\`, "${mod.id}"), got "${name}"`,
		);
		continue;
	}
	modules.set(mod.id, mod);
	for (const [, type] of source.matchAll(/type:\s*"(module\.\w+)"/g)) {
		if (type !== mod.id) nested.add(type);
	}
}

if (modules.size === 0) {
	console.error(
		`error: no module schemas under ${rel(wiring.files.schemaDir)}`,
	);
	process.exit(1);
}

// ── Files each module owns ─────────────────────────────────────────────────
for (const mod of modules.values()) {
	const files = wiring.moduleFiles(mod);
	if (!existsSync(files.component)) {
		fail(mod.id, `${rel(files.component)} is missing`);
	}
	if (!existsSync(files.query)) {
		fail(mod.id, `${rel(files.query)} is missing`);
	} else {
		const query = await readFile(files.query, "utf8");
		if (!new RegExp(`export const ${mod.queryVar}\\b`).test(query)) {
			fail(mod.id, `${rel(files.query)} does not export \`${mod.queryVar}\``);
		}
	}
}

// ── List slots ──────────────────────────────────────────────────────────────
/** @param {import("../src/manifest.mjs").ListSlot} slot */
async function readSlot(slot) {
	try {
		return slot.read(await readFile(slot.file, "utf8"));
	} catch (error) {
		general.push(`${rel(slot.file)}: ${/** @type {Error} */ (error).message}`);
		return null;
	}
}

for (const slot of wiring.required) {
	const listed = await readSlot(slot);
	if (!listed) continue;
	for (const id of modules.keys()) {
		if (!listed.has(id))
			fail(id, `missing in ${slot.label} (${rel(slot.file)})`);
	}
	for (const id of listed) {
		if (!modules.has(id)) {
			general.push(`${rel(slot.file)}: lists "${id}", which has no schema`);
		}
	}
}

/**
 * Slots that must name the same modules: a module is in every one of them or in none.
 * @param {import("../src/manifest.mjs").ListSlot[]} slots
 * @param {string} group for the finding
 * @returns {Promise<Set<string>>} the modules the group holds
 */
async function checkGroup(slots, group) {
	/** @type {Map<import("../src/manifest.mjs").ListSlot, Set<string>>} */
	const listedBy = new Map();
	for (const slot of slots) {
		const listed = await readSlot(slot);
		if (listed) listedBy.set(slot, listed);
	}
	const members = new Set([...listedBy.values()].flatMap((s) => [...s]));
	for (const id of members) {
		if (!modules.has(id)) {
			for (const [slot, listed] of listedBy) {
				if (listed.has(id))
					general.push(`${rel(slot.file)}: lists "${id}", which has no schema`);
			}
			continue;
		}
		for (const [slot, listed] of listedBy) {
			if (!listed.has(id)) {
				fail(
					id,
					`${group} in some places but missing in ${slot.label} — ${group} needs all three or none`,
				);
			}
		}
	}
	return members;
}

const pageModules = await checkGroup(wiring.page, "page stack");
const inlineModules = await checkGroup(wiring.inline, "inline");
for (const id of modules.keys()) {
	if (pageModules.has(id) || inlineModules.has(id)) continue;
	fail(
		id,
		nested.has(id)
			? "only inside another module: its parent projects it to its own shape, so ModuleOf has no type for it and its component can't compile; keep it in the page stack or inline"
			: "unused: neither in the page stack nor inline",
	);
}

// ── Report ─────────────────────────────────────────────────────────────────
for (const mod of modules.values()) {
	const findings = perModule.get(mod.id) ?? [];
	const inline = inlineModules.has(mod.id) ? " (inline)" : "";
	console.log(`${findings.length ? "✗" : "✓"} ${mod.id}${inline}`);
	for (const finding of findings) console.log(`    ${finding}`);
}
for (const finding of general) console.log(`✗ ${finding}`);

const failed = [...perModule.keys()].length + general.length;
if (failed > 0) {
	console.error(
		"\nWiring drift. Fix the entries above; `pnpm gen:module <Name>` scaffolds a new module with every point wired.",
	);
	process.exit(1);
}
console.log(`\n${modules.size} module(s) fully wired.`);
