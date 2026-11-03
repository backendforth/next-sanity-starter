// @ts-check
/**
 * The module wiring points, shared by `check-wiring` (reads them) and `scaffold-module`
 * (writes them), so the two can't disagree about where a module is registered.
 *
 * Each list slot finds its block by a header pattern and bracket matching — no marker
 * comments, and formatting or neighbouring code doesn't matter — then reports the module ids
 * it holds (`read`), returns the source with one more entry (`insert`) or with one entry less
 * (`remove`, used by `clear:modules`). A slot that can't find its block throws; the scaffolder
 * relies on that to abort before writing. An empty list is fine: `insert` then imports after
 * the file's last import.
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
 *   remove: (source: string, mod: ModuleNames) => string;
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

/** `module.contentRefs` → the names of `ContentRefs`. @param {string} id */
export function moduleNamesFromId(id) {
	const camel = id.replace(/^module\./, "");
	return moduleNames(camel.charAt(0).toUpperCase() + camel.slice(1));
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

/** The last line of any import, single- or multi-line. */
const IMPORT_END = /^(?:import [^\n]*|\} from [^\n]*);$/;

/** @param {string} source @param {RegExp} pattern */
function lastLineMatch(source, pattern) {
	return [...source.matchAll(new RegExp(pattern.source, "gm"))].at(-1);
}

/**
 * Inserts `line` after the last line matching `pattern`. Without one (no module imported yet,
 * e.g. after `clear:modules`) after the file's last import, else first in the file.
 *
 * @param {string} source @param {RegExp} pattern @param {string} line
 */
function insertAfterLastLine(source, pattern, line) {
	const last =
		lastLineMatch(source, pattern) ?? lastLineMatch(source, IMPORT_END);
	if (!last || last.index === undefined) return `${line}\n\n${source}`;
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

/** @param {string} text */
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/** An element's text without comments. @param {string} text */
const bare = (text) => text.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "").trim();

/** Drops every line that matches `pattern` in full. @param {string} source @param {RegExp} pattern */
function removeLines(source, pattern) {
	return source.replace(new RegExp(`${pattern.source}\\n?`, "gm"), "");
}

/**
 * The top-level elements of an array or object literal block, split at commas outside of
 * brackets, strings and comments. Each range runs from after the previous comma through its
 * own comma, if it has one.
 *
 * @param {string} source @param {{ start: number; end: number }} block
 */
function blockElements(source, block) {
	/** @type {{ start: number; end: number; comma: boolean }[]} */
	const elements = [];
	let depth = 0;
	let from = block.start;
	for (let i = block.start; i < block.end; i++) {
		const ch = source[i];
		if (ch === "/" && source[i + 1] === "/") {
			i = source.indexOf("\n", i);
			if (i === -1) break;
		} else if (ch === "/" && source[i + 1] === "*") {
			i = source.indexOf("*/", i) + 1;
		} else if (ch === '"' || ch === "'" || ch === "`") {
			for (i++; i < block.end && source[i] !== ch; i++) {
				if (source[i] === "\\") i++;
			}
		} else if (ch === "(" || ch === "[" || ch === "{") depth++;
		else if (ch === ")" || ch === "]" || ch === "}") depth--;
		else if (ch === "," && depth === 0) {
			elements.push({ start: from, end: i + 1, comma: true });
			from = i + 1;
		}
	}
	if (source.slice(from, block.end).trim()) {
		elements.push({ start: from, end: block.end, comma: false });
	}
	return elements;
}

/**
 * Drops the block's elements that `match` accepts. A last element without a trailing comma
 * takes the comma before it along.
 *
 * @param {string} source @param {{ start: number; end: number }} block
 * @param {(text: string) => boolean} match
 */
function removeElements(source, block, match) {
	const ranges = blockElements(source, block)
		.filter((el) =>
			match(bare(source.slice(el.start, el.end).replace(/,$/, ""))),
		)
		.map((el) => ({
			start:
				!el.comma && source[el.start - 1] === "," ? el.start - 1 : el.start,
			end: el.end,
		}));
	let out = source;
	let limit = source.length;
	for (const range of ranges.reverse()) {
		out = `${out.slice(0, range.start)}${out.slice(Math.min(range.end, limit))}`;
		limit = range.start;
	}
	return out;
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
	const RENDERER_SWITCH = /switch \((?:mod\.)?_type\) \{/;
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
		remove(source, mod) {
			const withoutImport = removeLines(
				source,
				new RegExp(
					`^import \\{ ${mod.schemaVar} \\} from "\\./objects/modules/\\w+";$`,
				),
			);
			const block = findBlock(withoutImport, SCHEMA_TYPES, this.file);
			return removeElements(withoutImport, block, (el) => el === mod.schemaVar);
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
		remove(source, mod) {
			const block = findBlock(source, MODULE_TYPES, this.file);
			return removeElements(source, block, (el) =>
				el.includes(`type: "${mod.id}"`),
			);
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
		remove(source, mod) {
			const withoutImport = removeLines(
				source,
				new RegExp(
					`^import \\{ ${mod.component} \\} from "\\./${mod.component}";$`,
				),
			);
			const block = findBlock(withoutImport, RENDERER_SWITCH, this.file);
			/* From the `case` line to the next `case` or `default:` at the same indent. */
			const branch = new RegExp(
				`^([ \\t]*)case "${escapeRegExp(mod.id)}":[\\s\\S]*?(?=^\\1(?:case |default:))`,
				"m",
			);
			const body = withoutImport
				.slice(block.start, block.end)
				.replace(branch, "");
			return `${withoutImport.slice(0, block.start)}${body}${withoutImport.slice(block.end)}`;
		},
	};

	/**
	 * A template literal of `${module…Query}` fragments. `insert` imports the new fragment from
	 * `from` and lists it after the template's last `${…}`, or, with none listed, after the
	 * projection's last field.
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
			);
			const block = findBlock(withImport, header, slot.file);
			const body = withImport.slice(block.start, block.end);
			const last = [...body.matchAll(/\$\{\w+\}/g)].at(-1);
			if (last?.index !== undefined) {
				const at = block.start + last.index + last[0].length;
				return `${withImport.slice(0, at)},\n${indent}\${${mod.queryVar}}${withImport.slice(at)}`;
			}
			const close = body.lastIndexOf("}");
			if (close === -1) {
				throw new Error(
					`${slot.file}: no \`\${…}\` or \`}\` to list the module at`,
				);
			}
			return appendToBlock(
				withImport,
				{ end: block.start + close },
				`,\n${indent}\${${mod.queryVar}}`,
			);
		},
		remove(source, mod) {
			const withoutImport = removeLines(
				source,
				new RegExp(`^import \\{ ${mod.queryVar} \\} from "[^"]+";$`),
			);
			const block = findBlock(withoutImport, header, slot.file);
			/* With the comma before it, or, as the first entry, the one after it. */
			const entry = new RegExp(
				`,\\s*\\$\\{${mod.queryVar}\\}|\\$\\{${mod.queryVar}\\},?[ \\t]*\\n?`,
			);
			const body = withoutImport
				.slice(block.start, block.end)
				.replace(entry, "");
			return `${withoutImport.slice(0, block.start)}${body}${withoutImport.slice(block.end)}`;
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
		remove(source, mod) {
			const block = findBlock(source, INLINE_OF, this.file);
			return removeElements(source, block, (el) =>
				el.includes(`type: "${mod.id}"`),
			);
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
			);
			const block = findBlock(withImport, INLINE_TYPES, this.file);
			const handler = `\n\t\t\t"${mod.id}": ({ value }) => (\n\t\t\t\t<div className="rich-text-embed w-full min-w-0">\n\t\t\t\t\t<${mod.component} module={stegaBrand(value)} locale={locale} siteLocale={siteLocale} />\n\t\t\t\t</div>\n\t\t\t),`;
			return appendToBlock(withImport, block, handler);
		},
		remove(source, mod) {
			const withoutImport = removeLines(
				source,
				new RegExp(
					`^import \\{ ${mod.component} \\} from "@/src/components/modules/${mod.component}";$`,
				),
			);
			const block = findBlock(withoutImport, INLINE_TYPES, this.file);
			return removeElements(withoutImport, block, (el) =>
				el.startsWith(`"${mod.id}":`),
			);
		},
	};

	return {
		files,
		/** Every module needs an entry in each of these. */
		required: [schemaIndex],
		/** The page stack (a document's `modules[]`): a module is in all three or in none. */
		page: [modulesArray, renderer, queryBarrel],
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
