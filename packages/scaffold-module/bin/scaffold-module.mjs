#!/usr/bin/env node
/**
 * Scaffolds a new content module across all 8 wiring points.
 *
 * Usage:
 *   pnpm gen:module <Name> [--dry-run] [--inline]
 *
 *   <Name>     PascalCase module name (e.g. "Hero", "Quote", "VideoStrip").
 *   --dry-run  Print what would change without writing.
 *   --inline   Also register the module as an inline block in
 *              studio/schemas/objects/editors/richTextMedia.ts (so editors can
 *              insert it inside Portable Text). Off by default — only enable
 *              for modules that genuinely make sense inline.
 *
 * The script creates 4 new files and inserts entries into 4 existing files
 * (schemas index, modulesArrayField, components barrel, queries barrel,
 * types barrel — and optionally richTextMedia). It then prints the snippet
 * to add to ModulesRenderer.tsx by hand, because that file has bespoke
 * dispatch logic that is unsafe to auto-edit.
 *
 * Run `pnpm check:wiring` afterwards to verify all 8 points are wired.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = fileURLToPath(new URL("../../..", import.meta.url));
const templatesDir = join(here, "..", "templates");

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const inline = argv.includes("--inline");
const rawName = argv.find((a) => !a.startsWith("--"));

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

const pascal = rawName; // Hero
const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1); // hero
const moduleId = `module.${camel}`; // module.hero
const componentName = `Module${pascal}`; // ModuleHero
const moduleVar = `module${pascal}`; // moduleHero
const moduleQueryVar = `module${pascal}Query`; // moduleHeroQuery
const moduleDataType = `Module${pascal}Data`; // ModuleHeroData
const fileBase = `module${pascal}`; // moduleHero -> studio file
const webFileBase = camel; // hero -> web query/type filenames

// ── target paths ───────────────────────────────────────────────────────────
const studioSchemaPath = join(
	root,
	"studio/schemas/objects/modules",
	`${fileBase}.ts`,
);
const webComponentPath = join(
	root,
	"web/src/components/modules",
	`${componentName}.tsx`,
);
const webQueryPath = join(
	root,
	"web/sanity/queries/components/modules",
	`${webFileBase}.ts`,
);
const webTypePath = join(root, "web/sanity/types/modules", `${webFileBase}.ts`);

const insertions = [];
const skipped = [];

function log(line) {
	console.log(line);
}

function rel(p) {
	return relative(root, p);
}

async function readTemplate(name) {
	return readFile(join(templatesDir, name), "utf8");
}

function fillTemplate(tmpl) {
	return tmpl
		.replaceAll("__MODULE_NAME__", moduleId)
		.replaceAll("__MODULE_TITLE__", pascal)
		.replaceAll("__MODULE_VAR__", moduleVar)
		.replaceAll("__MODULE_QUERY_VAR__", moduleQueryVar)
		.replaceAll("__MODULE_DATA_TYPE__", moduleDataType)
		.replaceAll("__MODULE_COMPONENT__", componentName)
		.replaceAll("__MODULE_FILE_BASE__", fileBase);
}

async function writeNewFile(target, content, label) {
	if (existsSync(target)) {
		skipped.push(`${rel(target)} (already exists)`);
		return;
	}
	if (dryRun) {
		log(`would create: ${rel(target)} (${label})`);
		return;
	}
	await mkdir(dirname(target), { recursive: true });
	await writeFile(target, content, "utf8");
	log(`created:      ${rel(target)} (${label})`);
}

/**
 * Replace the first match of `search` with `replacement` in the given file.
 * Returns true if a replacement was made.
 */
async function patch(file, search, replacement, description) {
	const original = await readFile(file, "utf8");
	if (original.includes(replacement)) {
		skipped.push(`${rel(file)} — ${description} (entry already present)`);
		return false;
	}
	const idx = original.indexOf(search);
	if (idx === -1) {
		console.error(
			`error: could not find anchor in ${rel(file)} for ${description}.\n  Anchor: ${JSON.stringify(search)}`,
		);
		process.exit(1);
	}
	if (dryRun) {
		log(`would patch:  ${rel(file)} (${description})`);
		insertions.push({ file: rel(file), description });
		return true;
	}
	const next = original.replace(search, replacement);
	await writeFile(file, next, "utf8");
	log(`patched:      ${rel(file)} (${description})`);
	insertions.push({ file: rel(file), description });
	return true;
}

// ── 1–4: create new files ─────────────────────────────────────────────────
const [schemaTmpl, componentTmpl, queryTmpl, typeTmpl] = await Promise.all([
	readTemplate("schema.ts.tmpl"),
	readTemplate("component.tsx.tmpl"),
	readTemplate("query.ts.tmpl"),
	readTemplate("type.ts.tmpl"),
]);

await writeNewFile(studioSchemaPath, fillTemplate(schemaTmpl), "studio schema");
await writeNewFile(
	webComponentPath,
	fillTemplate(componentTmpl),
	"web component",
);
await writeNewFile(webQueryPath, fillTemplate(queryTmpl), "GROQ projection");
await writeNewFile(webTypePath, fillTemplate(typeTmpl), "TS type");

// ── 5: studio/schemas/index.ts (import + schemaTypes entry) ───────────────
const schemasIndex = join(root, "studio/schemas/index.ts");
const importLine = `import { ${moduleVar} } from "./objects/modules/${fileBase}";\n`;
await patch(
	schemasIndex,
	`import { richText } from "./objects/editors/richText";`,
	`${importLine}import { richText } from "./objects/editors/richText";`,
	"schemas/index.ts import",
);
await patch(
	schemasIndex,
	`  moduleText,\n`,
	`  moduleText,\n  ${moduleVar},\n`,
	"schemas/index.ts schemaTypes entry",
);

// ── 6: studio/schemas/fields/modulesArrayField.ts ─────────────────────────
const modulesArrayField = join(
	root,
	"studio/schemas/fields/modulesArrayField.ts",
);
await patch(
	modulesArrayField,
	`  { type: "module.text" },\n`,
	`  { type: "module.text" },\n  { type: "${moduleId}" },\n`,
	"modulesArrayField.ts moduleTypes entry",
);

// ── 6 (optional): richTextMedia.ts inline registration ────────────────────
if (inline) {
	const richTextMedia = join(
		root,
		"studio/schemas/objects/editors/richTextMedia.ts",
	);
	await patch(
		richTextMedia,
		`    defineArrayMember({\n      type: "module.carousel",\n      components: { preview: CarouselRichTextPreview },\n    }),\n  ],\n});`,
		`    defineArrayMember({\n      type: "module.carousel",\n      components: { preview: CarouselRichTextPreview },\n    }),\n    { type: "${moduleId}" },\n  ],\n});`,
		"richTextMedia.ts inline block",
	);
}

// ── 7: web/src/components/modules/index.ts barrel ─────────────────────────
const webBarrel = join(root, "web/src/components/modules/index.ts");
await patch(
	webBarrel,
	`export { ModuleText } from "./ModuleText";\n`,
	`export { ModuleText } from "./ModuleText";\nexport { ${componentName} } from "./${componentName}";\n`,
	"components/modules barrel",
);

// ── 8: web/sanity/queries/components/modules/index.ts barrel ──────────────
const queriesBarrel = join(
	root,
	"web/sanity/queries/components/modules/index.ts",
);
await patch(
	queriesBarrel,
	`import { moduleTextQuery } from "./text";\n`,
	`import { moduleTextQuery } from "./text";\nimport { ${moduleQueryVar} } from "./${webFileBase}";\n`,
	"queries/modules barrel import",
);
await patch(
	queriesBarrel,
	`  \${moduleContentRefsQuery}\n}\`;`,
	`  \${moduleContentRefsQuery},\n  \${${moduleQueryVar}}\n}\`;`,
	"queries/modules barrel modulesQuery entry",
);
await patch(
	queriesBarrel,
	`export {\n\tmoduleCarouselQuery,\n\tmoduleContentRefsQuery,\n\tmoduleMediaQuery,\n\tmoduleTextQuery,\n};`,
	`export {\n\tmoduleCarouselQuery,\n\tmoduleContentRefsQuery,\n\tmoduleMediaQuery,\n\tmoduleTextQuery,\n\t${moduleQueryVar},\n};`,
	"queries/modules barrel re-export",
);

// ── 9: web/sanity/types/modules/index.ts barrel ───────────────────────────
const typesBarrel = join(root, "web/sanity/types/modules/index.ts");
await patch(
	typesBarrel,
	`export type { ModuleTextData } from "./text";\n`,
	`export type { ModuleTextData } from "./text";\nexport type { ${moduleDataType} } from "./${webFileBase}";\n`,
	"types/modules barrel export",
);
await patch(
	typesBarrel,
	`import type { ModuleTextData } from "./text";\n`,
	`import type { ModuleTextData } from "./text";\nimport type { ${moduleDataType} } from "./${webFileBase}";\n`,
	"types/modules barrel import",
);
await patch(
	typesBarrel,
	`Partial<ModuleContentRefsData>;`,
	`Partial<ModuleContentRefsData> &\n\tPartial<${moduleDataType}>;`,
	"types/modules ContentModule union",
);

// ── done. Print ModulesRenderer.tsx snippet for manual application ────────
const rendererSnippet = `\n──────────────────────────────────────────────────────────────────────────
ModulesRenderer.tsx is NOT auto-edited (dispatch logic is bespoke).
YOU MUST add the following by hand to web/src/components/modules/ModulesRenderer.tsx:

1. Add to the type import list:
     ${moduleDataType},

2. Add the import:
     import { ${componentName} } from "./${componentName}";

3. Add a branch inside renderModuleChild():
     if (mod._type === "${moduleId}") {
       return (
         <${componentName}
           module={mod as ${moduleDataType}}
           locale={locale}
           siteLocale={siteLocale}
         />
       );
     }

After editing, run:
  pnpm studio:generate && pnpm check:wiring && pnpm typecheck
──────────────────────────────────────────────────────────────────────────
`;

if (skipped.length > 0) {
	log("\nSkipped (no change needed):");
	for (const s of skipped) log(`  - ${s}`);
}

log(rendererSnippet);

if (dryRun) {
	log("Dry-run complete. Re-run without --dry-run to apply.");
}
