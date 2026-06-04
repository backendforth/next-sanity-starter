#!/usr/bin/env node
/**
 * Validates that every module declared in studio/schemas/objects/modules/
 * is correctly wired across the 8 points of the module pattern.
 *
 * Usage:
 *   pnpm check:wiring
 *
 * Exits 0 when every module is fully wired. Exits 1 with a per-module
 * report when drift is found. Intended for CI gating and local pre-flight
 * after running `pnpm gen:module` or hand-editing modules.
 *
 * The 8 wiring points checked per `module.<id>`:
 *
 *   1. studio/schemas/objects/modules/module<Name>.ts   (schema file exists with the right `name`)
 *   2. studio/schemas/index.ts                          (import + schemaTypes entry)
 *   3. studio/schemas/objects/editors/richTextMedia.ts  (OPTIONAL inline registration — warned, not failed)
 *   4. studio/schemas/fields/modulesArrayField.ts       (moduleTypes entry)
 *   5. web/src/components/modules/Module<Name>.tsx      (component file exists)
 *   6. web/src/components/modules/index.ts              (barrel export, if a barrel exists on this branch)
 *   7. web/sanity/queries/components/modules/<name>.ts  (GROQ projection)
 *   8. web/sanity/types/modules/<name>.ts               (TS type)
 *
 * Some branches diverge (e.g. `variant/document-level` has no
 * components/modules barrel). The checker treats the missing barrel as a
 * skipped point — it does NOT fail — so the same script works on both
 * long-lived branches.
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../..", import.meta.url));

const STUDIO_MODULES_DIR = join(root, "studio/schemas/objects/modules");
const SCHEMAS_INDEX = join(root, "studio/schemas/index.ts");
const MODULES_ARRAY_FIELD = join(
	root,
	"studio/schemas/fields/modulesArrayField.ts",
);
const RICH_TEXT_MEDIA = join(
	root,
	"studio/schemas/objects/editors/richTextMedia.ts",
);
const WEB_COMPONENTS_DIR = join(root, "web/src/components/modules");
const WEB_COMPONENTS_BARREL = join(WEB_COMPONENTS_DIR, "index.ts");
const QUERIES_DIR = join(root, "web/sanity/queries/components/modules");
const QUERIES_BARREL = join(QUERIES_DIR, "index.ts");
const TYPES_DIR = join(root, "web/sanity/types/modules");
const TYPES_BARREL = join(TYPES_DIR, "index.ts");

/** @typedef {{ file: string; rule: string }} Finding */

/**
 * @param {string} dir
 */
async function listFiles(dir) {
	if (!existsSync(dir)) return [];
	return (await readdir(dir, { withFileTypes: true }))
		.filter((e) => e.isFile())
		.map((e) => e.name);
}

async function read(file) {
	if (!existsSync(file)) return null;
	return readFile(file, "utf8");
}

function rel(p) {
	return relative(root, p);
}

function pascalFromCamel(camel) {
	return camel.charAt(0).toUpperCase() + camel.slice(1);
}

// ── 1. Discover module schemas ─────────────────────────────────────────────
const schemaFiles = (await listFiles(STUDIO_MODULES_DIR)).filter((f) =>
	f.endsWith(".ts"),
);

if (schemaFiles.length === 0) {
	console.error(
		`error: no module schemas found under ${rel(STUDIO_MODULES_DIR)}.`,
	);
	process.exit(1);
}

/** @type {{ id: string; pascal: string; camel: string; schemaFile: string; varName: string }[]} */
const modules = [];

for (const file of schemaFiles) {
	const content = await read(join(STUDIO_MODULES_DIR, file));
	if (!content) continue;
	// extract `name: "module.<id>"`
	const nameMatch = content.match(/name:\s*"(module\.[A-Za-z0-9_-]+)"/);
	const exportMatch = content.match(
		/export\s+const\s+(module[A-Za-z0-9_]+)\s*=/,
	);
	if (!nameMatch || !exportMatch) {
		console.warn(
			`warn: could not parse module name/export from ${rel(join(STUDIO_MODULES_DIR, file))}`,
		);
		continue;
	}
	const id = nameMatch[1]; // module.hero
	const varName = exportMatch[1]; // moduleHero
	const camel = id.replace(/^module\./, ""); // hero
	const pascal = pascalFromCamel(camel); // Hero
	modules.push({
		id,
		pascal,
		camel,
		varName,
		schemaFile: join(STUDIO_MODULES_DIR, file),
	});
}

// ── 2-8. Load shared files once ────────────────────────────────────────────
const [
	schemasIndexSrc,
	modulesArrayFieldSrc,
	richTextMediaSrc,
	componentsBarrelSrc,
	queriesBarrelSrc,
	typesBarrelSrc,
] = await Promise.all([
	read(SCHEMAS_INDEX),
	read(MODULES_ARRAY_FIELD),
	read(RICH_TEXT_MEDIA),
	read(WEB_COMPONENTS_BARREL),
	read(QUERIES_BARREL),
	read(TYPES_BARREL),
]);

if (!schemasIndexSrc) {
	console.error(`error: missing ${rel(SCHEMAS_INDEX)}`);
	process.exit(1);
}
if (!modulesArrayFieldSrc) {
	console.error(`error: missing ${rel(MODULES_ARRAY_FIELD)}`);
	process.exit(1);
}

/** @type {Map<string, Finding[]>} */
const findingsPerModule = new Map();
/** @type {Finding[]} */
const warnings = [];

function add(moduleId, file, rule) {
	const arr = findingsPerModule.get(moduleId) ?? [];
	arr.push({ file: rel(file), rule });
	findingsPerModule.set(moduleId, arr);
}

for (const m of modules) {
	// 2. schemas/index.ts — import + schemaTypes entry
	if (!schemasIndexSrc.includes(`from "./objects/modules/`)) {
		// nothing useful to check beyond presence of var name
	}
	if (!schemasIndexSrc.includes(`{ ${m.varName} }`)) {
		add(m.id, SCHEMAS_INDEX, `missing import of ${m.varName}`);
	}
	if (
		!new RegExp(`(^|\n)\\s*${m.varName}\\s*,?\\s*(\n|$)`).test(schemasIndexSrc)
	) {
		add(m.id, SCHEMAS_INDEX, `${m.varName} not present in schemaTypes`);
	}

	// 4. modulesArrayField.ts — entry for `type: "${id}"`
	if (!modulesArrayFieldSrc.includes(`"${m.id}"`)) {
		add(
			m.id,
			MODULES_ARRAY_FIELD,
			`no entry for type "${m.id}" in moduleTypes`,
		);
	}

	// 3. richTextMedia.ts — optional. Warn only.
	if (richTextMediaSrc && !richTextMediaSrc.includes(`"${m.id}"`)) {
		warnings.push({
			file: rel(RICH_TEXT_MEDIA),
			rule: `"${m.id}" is not registered as an inline block (richTextMedia). Skip if intentional.`,
		});
	}

	// 5. web component file
	const componentFile = join(WEB_COMPONENTS_DIR, `Module${m.pascal}.tsx`);
	const componentInDir = existsSync(componentFile);
	const altComponentDir = join(
		root,
		"web/src/components",
		m.camel,
		`Module${m.pascal}.tsx`,
	);
	const componentInSibling = existsSync(altComponentDir);
	if (!componentInDir && !componentInSibling) {
		// On variant/document-level, ModuleContentRefs has only a placeholder. Tolerate that case if a placeholder branch exists in ModulesRenderer.
		const renderer = await read(
			join(WEB_COMPONENTS_DIR, "ModulesRenderer.tsx"),
		);
		const hasPlaceholder = renderer?.includes(`Module${m.pascal}Placeholder`);
		if (!hasPlaceholder) {
			add(
				m.id,
				componentFile,
				`web component Module${m.pascal}.tsx is missing (no fallback Module${m.pascal}Placeholder either)`,
			);
		}
	}

	// 6. components barrel — optional (variant branch omits it)
	if (componentsBarrelSrc && componentInDir) {
		if (!componentsBarrelSrc.includes(`Module${m.pascal}`)) {
			add(
				m.id,
				WEB_COMPONENTS_BARREL,
				`Module${m.pascal} not re-exported from barrel`,
			);
		}
	}

	// 7. GROQ query file + barrel
	const queryFile = join(QUERIES_DIR, `${m.camel}.ts`);
	if (!existsSync(queryFile)) {
		add(m.id, queryFile, `GROQ projection file missing`);
	} else if (queriesBarrelSrc) {
		const queryVar = `${m.varName}Query`;
		if (!queriesBarrelSrc.includes(queryVar)) {
			add(m.id, QUERIES_BARREL, `${queryVar} not referenced in queries barrel`);
		}
	}

	// 8. TS type file + barrel
	const typeFile = join(TYPES_DIR, `${m.camel}.ts`);
	if (!existsSync(typeFile)) {
		add(m.id, typeFile, `TS type file missing`);
	} else if (typesBarrelSrc) {
		const typeName = `Module${m.pascal}Data`;
		if (!typesBarrelSrc.includes(typeName)) {
			add(m.id, TYPES_BARREL, `${typeName} not referenced in types barrel`);
		}
	}
}

// ── Report ─────────────────────────────────────────────────────────────────
let failed = 0;
for (const m of modules) {
	const findings = findingsPerModule.get(m.id);
	if (!findings || findings.length === 0) {
		console.log(`✓ ${m.id}`);
	} else {
		failed++;
		console.log(`✗ ${m.id}`);
		for (const f of findings) {
			console.log(`    ${f.file}: ${f.rule}`);
		}
	}
}

if (warnings.length > 0) {
	console.log(`\nWarnings (not failures):`);
	for (const w of warnings) {
		console.log(`  ${w.file}: ${w.rule}`);
	}
}

if (failed > 0) {
	console.error(
		`\n${failed} of ${modules.length} modules have wiring drift. Fix the entries above or run \`pnpm gen:module <Name>\` for a fresh module.`,
	);
	process.exit(1);
}

console.log(
	`\n${modules.length} module(s) fully wired. (${warnings.length} optional warning${warnings.length === 1 ? "" : "s"})`,
);
