#!/usr/bin/env node
/**
 * Checks that Sanity TypeGen typed every query in `web/sanity/`.
 *
 * Usage:
 *   pnpm check:typegen   (part of `pnpm generate`, after both typegens)
 *
 * TypeGen skips a `defineQuery` it cannot evaluate statically — a function call, a
 * non-`const` fragment — with nothing but a spinner warning, and the generated file simply
 * lacks the entry. The query then types as `unknown` and CI's diff check stays green. This
 * script compares both sides by name: every `defineQuery` assignment needs a
 * `// Variable: <name>` block in `web/sanity/sanity.types.gen.ts`, and every block needs a
 * `defineQuery` that still exists.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const QUERY_ROOT = join(root, "web/sanity");
const GENERATED = join(QUERY_ROOT, "sanity.types.gen.ts");

const DEFINE_QUERY = /\bconst\s+(\w+)\s*=\s*defineQuery\s*\(/g;
const GENERATED_VARIABLE = /^\/\/ Variable: (\w+)$/gm;

/** @param {string} dir @returns {Promise<string[]>} */
async function sourceFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map((entry) => {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) return sourceFiles(path);
			const isSource = /\.tsx?$/.test(entry.name) && path !== GENERATED;
			return isSource ? [path] : [];
		}),
	);
	return nested.flat();
}

/** @type {Map<string, string>} query name → file that defines it */
const defined = new Map();
for (const file of await sourceFiles(QUERY_ROOT)) {
	const source = await readFile(file, "utf8");
	for (const [, name] of source.matchAll(DEFINE_QUERY)) {
		defined.set(name, relative(root, file));
	}
}

const generated = new Set(
	[...(await readFile(GENERATED, "utf8")).matchAll(GENERATED_VARIABLE)].map(
		([, name]) => name,
	),
);

const untyped = [...defined].filter(([name]) => !generated.has(name));
const stale = [...generated].filter((name) => !defined.has(name));

for (const [name, file] of untyped) {
	console.error(
		`✗ ${name} (${file}) has no generated type — TypeGen could not evaluate it. Keep queries free of function calls and build them from \`const\` template strings only.`,
	);
}
for (const name of stale) {
	console.error(
		`✗ ${name} is typed in ${relative(root, GENERATED)} but no longer defined — run \`pnpm generate\`.`,
	);
}

if (untyped.length > 0 || stale.length > 0) process.exit(1);

console.log(`✓ ${defined.size} queries typed by TypeGen.`);
