// @ts-check
/**
 * The module wiring points, shared by `check-wiring` (reads them) and `scaffold-module`
 * (writes them), so the two can't disagree about where a module is registered.
 *
 * Each list slot finds its block by a header pattern and bracket matching — no marker
 * comments, and formatting or neighbouring code doesn't matter — then reports the module ids
 * it holds (`read`) or returns the source with one more entry (`insert`). An `insert` that
 * can't find its anchor throws; the scaffolder relies on that to abort before writing.
 */
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @typedef {{
 *   id: string;         // module.hero
 *   camel: string;      // hero
 *   pascal: string;     // Hero
 *   component: string;  // ModuleHero
 *   schemaVar: string;  // moduleHero
 *   queryVar: string;   // moduleHeroQuery
 * }} ModuleNames
 *
 * @typedef {{
 *   label: string;
 *   file: string;
 *   read: (source: string) => Set<string>;
 *   insert: (source: string, mod: ModuleNames) => string;
 * }} ListSlot
 */

/** The checkout to work on: `--root <dir>` (the tooling tests), else this repo. @param {string[]} argv */
export function rootFromArgv(argv) {
	const flag = argv.indexOf("--root");
	return flag === -1
		? fileURLToPath(new URL("../../..", import.meta.url))
		: resolve(argv[flag + 1] ?? ".");
}

/** @param {string} pascal */
export function moduleNames(pascal) {
	const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
	return {
		id: `module.${camel}`,
		camel,
		pascal,
		component: `Module${pascal}`,
		schemaVar: `module${pascal}`,
		queryVar: `module${pascal}Query`,
	};
}

/** `moduleHero` / `ModuleHero` / `moduleHeroQuery` → `module.hero`. */
/** @param {string} name */
function idFromIdentifier(name) {
	const pascal = name.replace(/^[Mm]odule/, "").replace(/Query$/, "");
	return `module.${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}

// ── Block finding ───────────────────────────────────────────────────────────

const CLOSING = /** @type {Record<string, string>} */ ({
	"[": "]",
	"{": "}",
	"`": "`",
});

/**
 * The block that `header` opens: `header` must end in its opening bracket (`[`, `{` or a
 * backtick). Returns the offsets of the content between the brackets.
 *
 * @param {string} source
 * @param {RegExp} header
 * @param {string} file for the error message
 */
export function findBlock(source, header, file) {
	const match = header.exec(source);
	if (!match) {
		throw new Error(`${file}: no block matching ${header}`);
	}
	const open = match[0].at(-1) ?? "";
	const close = CLOSING[open];
	if (!close) throw new Error(`${header} must end in [, { or a backtick`);
	const start = match.index + match[0].length;
	if (open === "`") {
		const end = source.indexOf("`", start);
		if (end === -1) throw new Error(`${file}: unterminated template`);
		return { start, end };
	}
	let depth = 1;
	for (let i = start; i < source.length; i++) {
		if (source[i] === open) depth++;
		else if (source[i] === close && --depth === 0) return { start, end: i };
	}
	throw new Error(`${file}: unbalanced ${open} after ${header}`);
}

/** @param {string} text @param {RegExp} pattern @param {(m: string) => string} [toId] */
function collect(text, pattern, toId = (m) => m) {
	return new Set([...text.matchAll(pattern)].map((m) => toId(m[1] ?? "")));
}

/** Inserts `line` after the last line matching `pattern`. @param {string} source @param {RegExp} pattern @param {string} line @param {string} file */
function insertAfterLastLine(source, pattern, line, file) {
	const matches = [...source.matchAll(new RegExp(pattern.source, "gm"))];
	const last = matches.at(-1);
	if (!last || last.index === undefined) {
		throw new Error(`${file}: no line matching ${pattern}`);
	}
	const lineEnd = source.indexOf("\n", last.index);
	const at = lineEnd === -1 ? source.length : lineEnd + 1;
	return `${source.slice(0, at)}${line}\n${source.slice(at)}`;
}

/** Inserts `text` right before the block's closing bracket, after its last non-blank char. @param {string} source @param {{ end: number }} block @param {string} text */
function appendToBlock(source, block, text) {
	let at = block.end;
	while (at > 0 && /\s/.test(source[at - 1] ?? "")) at--;
	return `${source.slice(0, at)}${text}${source.slice(at)}`;
}

// ── Slots ───────────────────────────────────────────────────────────────────

/** @param {string} root */
export function wiringSlots(root) {
	const files = {
		schemaDir: join(root, "studio/schemas/objects/modules"),
		schemaIndex: join(root, "studio/schemas/index.ts"),
		modulesArray: join(root, "studio/schemas/fields/modulesArrayField.ts"),
		inlineSchema: join(root, "studio/schemas/objects/editors/richTextMedia.ts"),
		componentDir: join(root, "web/src/components/modules"),
		renderer: join(root, "web/src/components/modules/ModulesRenderer.tsx"),
		inlineComponents: join(
			root,
			"web/src/components/text/portableTextComponents.tsx",
		),
		queryDir: join(root, "web/sanity/queries/components/modules"),
		queryBarrel: join(root, "web/sanity/queries/components/modules/index.ts"),
		inlineQuery: join(
			root,
			"web/sanity/queries/components/text/richTextMedia.ts",
		),
	};

	const SCHEMA_IMPORT =
		/^import \{ (module\w+) \} from "\.\/objects\/modules\/\w+";$/;
	const SCHEMA_TYPES = /export const schemaTypes = \[/;
	const MODULE_TYPES = /export const moduleTypes = \[/;
	const INLINE_OF =
		/export const richTextMedia = defineType\(\{[\s\S]*?\bof: \[/;
	const RENDERER_SWITCH = /switch \(mod\._type\) \{/;
	const RENDERER_IMPORT = /^import \{ (Module\w+) \} from "\.\/Module\w+";$/;
	const MODULES_QUERY = /export const modulesQuery = `/;
	const INLINE_QUERY = /export const richTextMediaQuery = `/;
	const QUERY_IMPORT = /^import \{ (module\w+Query) \} from "\.\.?\/[\w/]+";$/;
	const INLINE_TYPES = /\btypes: \{/;
	const COMPONENT_IMPORT =
		/^import \{ (Module\w+) \} from "@\/src\/components\/modules\/Module\w+";$/;

	/** @type {ListSlot} */
	const schemaIndex = {
		label: "schemas/index.ts — import + schemaTypes entry",
		file: files.schemaIndex,
		read(source) {
			const imported = collect(
				source,
				new RegExp(SCHEMA_IMPORT.source, "gm"),
				idFromIdentifier,
			);
			const block = findBlock(source, SCHEMA_TYPES, this.file);
			const listed = collect(
				source.slice(block.start, block.end),
				/\b(module[A-Z]\w*)\b/g,
				idFromIdentifier,
			);
			return new Set([...imported].filter((id) => listed.has(id)));
		},
		insert(source, mod) {
			const withImport = insertAfterLastLine(
				source,
				SCHEMA_IMPORT,
				`import { ${mod.schemaVar} } from "./objects/modules/${mod.schemaVar}";`,
				this.file,
			);
			const block = findBlock(withImport, SCHEMA_TYPES, this.file);
			const body = withImport.slice(block.start, block.end);
			const lastModule = [...body.matchAll(/^([ \t]*)module[A-Z]\w*,\n/gm)].at(
				-1,
			);
			if (!lastModule || lastModule.index === undefined) {
				return appendToBlock(withImport, block, `,\n  ${mod.schemaVar}`);
			}
			const at = block.start + lastModule.index + lastModule[0].length;
			return `${withImport.slice(0, at)}${lastModule[1] ?? ""}${mod.schemaVar},\n${withImport.slice(at)}`;
		},
	};

	/** @type {ListSlot} */
	const modulesArray = {
		label: "modulesArrayField.ts — moduleTypes entry",
		file: files.modulesArray,
		read(source) {
			const block = findBlock(source, MODULE_TYPES, this.file);
			return collect(
				source.slice(block.start, block.end),
				/type: "(module\.\w+)"/g,
			);
		},
		insert(source, mod) {
			const block = findBlock(source, MODULE_TYPES, this.file);
			return appendToBlock(source, block, `\n  { type: "${mod.id}" },`);
		},
	};

	/** @type {ListSlot} */
	const renderer = {
		label: "ModulesRenderer.tsx — `case` in renderModuleChild()",
		file: files.renderer,
		read(source) {
			const block = findBlock(source, RENDERER_SWITCH, this.file);
			return collect(
				source.slice(block.start, block.end),
				/case "(module\.\w+)":/g,
			);
		},
		insert(source, mod) {
			const withImport = insertAfterLastLine(
				source,
				RENDERER_IMPORT,
				`import { ${mod.component} } from "./${mod.component}";`,
				this.file,
			);
			const block = findBlock(withImport, RENDERER_SWITCH, this.file);
			const body = withImport.slice(block.start, block.end);
			const defaultCase = /^([ \t]*)default:/m.exec(body);
			if (!defaultCase) throw new Error(`${this.file}: no \`default:\` case`);
			const indent = defaultCase[1] ?? "";
			const at = block.start + defaultCase.index + indent.length;
			const branch = `case "${mod.id}":\n${indent}\treturn (\n${indent}\t\t<${mod.component} module={mod} locale={locale} siteLocale={siteLocale} />\n${indent}\t);\n${indent}`;
			return `${withImport.slice(0, at)}${branch}${withImport.slice(at)}`;
		},
	};

	/**
	 * A template literal of `${module…Query}` fragments. `insert` imports the new fragment from
	 * `from` and lists it after the template's last `${…}`.
	 *
	 * @param {Pick<ListSlot, "label" | "file"> & { header: RegExp; indent: string; from: (mod: ModuleNames) => string }} spec
	 * @returns {ListSlot}
	 */
	const queryList = ({ header, indent, from, ...slot }) => ({
		...slot,
		read(source) {
			const block = findBlock(source, header, slot.file);
			return collect(
				source.slice(block.start, block.end),
				/\$\{(module\w+Query)\}/g,
				idFromIdentifier,
			);
		},
		insert(source, mod) {
			const withImport = insertAfterLastLine(
				source,
				QUERY_IMPORT,
				`import { ${mod.queryVar} } from "${from(mod)}";`,
				slot.file,
			);
			const block = findBlock(withImport, header, slot.file);
			const body = withImport.slice(block.start, block.end);
			const last = [...body.matchAll(/\$\{\w+\}/g)].at(-1);
			if (!last || last.index === undefined) {
				throw new Error(`${slot.file}: no \`\${…}\` to list the module after`);
			}
			const at = block.start + last.index + last[0].length;
			return `${withImport.slice(0, at)},\n${indent}\${${mod.queryVar}}${withImport.slice(at)}`;
		},
	});

	const queryBarrel = queryList({
		label: "queries/components/modules/index.ts — import + modulesQuery entry",
		file: files.queryBarrel,
		header: MODULES_QUERY,
		indent: "  ",
		from: (mod) => `./${mod.camel}`,
	});

	/** @type {ListSlot} */
	const inlineSchema = {
		label: "richTextMedia.ts (studio) — inline `of` entry",
		file: files.inlineSchema,
		read(source) {
			const block = findBlock(source, INLINE_OF, this.file);
			return collect(
				source.slice(block.start, block.end),
				/type: "(module\.\w+)"/g,
			);
		},
		insert(source, mod) {
			const block = findBlock(source, INLINE_OF, this.file);
			return appendToBlock(source, block, `\n    { type: "${mod.id}" },`);
		},
	};

	const inlineQuery = queryList({
		label: "richTextMediaQuery — inline module projection",
		file: files.inlineQuery,
		header: INLINE_QUERY,
		indent: "    ",
		from: (mod) => `../modules/${mod.camel}`,
	});

	/** @type {ListSlot} */
	const inlineComponents = {
		label: "portableTextComponents.tsx — `types` handler",
		file: files.inlineComponents,
		read(source) {
			const block = findBlock(source, INLINE_TYPES, this.file);
			return collect(source.slice(block.start, block.end), /"(module\.\w+)":/g);
		},
		insert(source, mod) {
			const withImport = insertAfterLastLine(
				source,
				COMPONENT_IMPORT,
				`import { ${mod.component} } from "@/src/components/modules/${mod.component}";`,
				this.file,
			);
			const block = findBlock(withImport, INLINE_TYPES, this.file);
			const handler = `\n\t\t\t"${mod.id}": ({ value }) => (\n\t\t\t\t<div className="rich-text-embed w-full min-w-0">\n\t\t\t\t\t<${mod.component} module={stegaBrand(value)} locale={locale} siteLocale={siteLocale} />\n\t\t\t\t</div>\n\t\t\t),`;
			return appendToBlock(withImport, block, handler);
		},
	};

	return {
		files,
		/** Every module needs an entry in each of these. */
		required: [schemaIndex, modulesArray, renderer, queryBarrel],
		/** Inline is opt-in: a module is in all three or in none. */
		inline: [inlineSchema, inlineQuery, inlineComponents],
		/** Files a module owns, created by the scaffolder. @param {ModuleNames} mod */
		moduleFiles: (mod) => ({
			schema: join(files.schemaDir, `${mod.schemaVar}.ts`),
			component: join(files.componentDir, `${mod.component}.tsx`),
			query: join(files.queryDir, `${mod.camel}.ts`),
		}),
	};
}
