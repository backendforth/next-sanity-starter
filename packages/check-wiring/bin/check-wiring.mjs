#!/usr/bin/env node
// @ts-check
/**
 * Validates the module wiring documented in AGENTS.md ("The module pattern").
 *
 * Usage:
 *   pnpm check:wiring
 *
 * Every `module.<id>` schema under studio/schemas/objects/modules/ must have its component and
 * GROQ projection file and an entry in each list slot of `src/manifest.mjs`: schema index,
 * `moduleTypes`, the `ModulesRenderer` switch, `modulesQuery`. A slot that
 * lists a module without a schema is stale and fails too. Inline modules are opt-in: the
 * Studio's `richTextMedia` `of`, `richTextMediaQuery` and the `types` map in
 * `portableTextComponents.tsx` must name the same modules.
 *
 * The module's TS type is not a wiring point: it is `ModuleOf<"module.<id>">` from the
 * generated query types, and `tsc` checks its fields and the renderer's `never` fallback.
 *
 * Exits 1 with a report when anything drifts. Pass `--root <dir>` to check another checkout
 * (the tooling tests do).
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { moduleNames, wiringSlots } from "../src/manifest.mjs";

const rootFlag = process.argv.indexOf("--root");
const root =
	rootFlag === -1
		? fileURLToPath(new URL("../../..", import.meta.url))
		: resolve(process.argv[rootFlag + 1] ?? ".");

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

const renderer = await readFile(wiring.files.renderer, "utf8");
if (!/:\s*never\s*=\s*mod\b/.test(renderer)) {
	general.push(
		`${rel(wiring.files.renderer)}: the switch lost its \`const unhandled: never = mod\` fallback — without it a missing \`case\` compiles`,
	);
}

/** @type {Map<string, Set<string>>} slot label → modules it lists */
const inlineSlots = new Map();
for (const slot of wiring.inline) {
	const listed = await readSlot(slot);
	if (listed) inlineSlots.set(slot.label, listed);
}
const inlineModules = new Set([...inlineSlots.values()].flatMap((s) => [...s]));
for (const id of inlineModules) {
	if (!modules.has(id)) {
		general.push(`inline module "${id}" has no schema`);
		continue;
	}
	for (const [label, listed] of inlineSlots) {
		if (!listed.has(id)) {
			fail(
				id,
				`inline in some places but missing in ${label} — inline needs all three or none`,
			);
		}
	}
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
