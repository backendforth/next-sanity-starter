// @ts-check
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
	findBlock,
	moduleNames,
	moduleNamesFromId,
	wiringSlots,
} from "../src/manifest.mjs";

const repo = fileURLToPath(new URL("../../..", import.meta.url));
const checkWiring = fileURLToPath(
	new URL("../bin/check-wiring.mjs", import.meta.url),
);

/*
 * The tests add these to a copy and work on them, not on the repo's own modules: a project
 * replaces those (`pnpm clear:modules`), and `pnpm test:tooling` runs in every project.
 */
const pageProbe = moduleNames("PageProbe");
const inlineProbe = moduleNames("InlineProbe");

test("findBlock matches nested brackets and template literals", () => {
	const source =
		"const a = [\n  [1, 2],\n  { b: [3] },\n];\nconst q = " + "`x{\u0024{y}}`;";
	const array = findBlock(source, /const a = \[/, "fixture");
	assert.equal(
		source.slice(array.start, array.end).trim(),
		"[1, 2],\n  { b: [3] },",
	);
	const template = findBlock(source, /const q = `/, "fixture");
	assert.equal(source.slice(template.start, template.end), `x{\${y}}`);
	assert.throws(
		() => findBlock(source, /const missing = \[/, "fixture"),
		/no block/,
	);
});

test("every slot reads the repo's modules and takes a new one", async () => {
	const wiring = wiringSlots(repo);
	for (const slot of [...wiring.required, ...wiring.page]) {
		const source = await readFile(slot.file, "utf8");
		const before = slot.read(source);
		const after = slot.read(slot.insert(source, pageProbe));
		assert.deepEqual(
			[...after].sort(),
			[...before, pageProbe.id].sort(),
			slot.label,
		);
	}
	for (const slot of wiring.inline) {
		const source = await readFile(slot.file, "utf8");
		assert.ok(
			slot.read(slot.insert(source, pageProbe)).has(pageProbe.id),
			slot.label,
		);
	}
});

test("every slot drops its modules one by one, then takes a new one with one comma", async () => {
	const wiring = wiringSlots(repo);
	for (const slot of [...wiring.required, ...wiring.page, ...wiring.inline]) {
		let source = await readFile(slot.file, "utf8");
		for (const id of slot.read(source)) {
			const rest = [...slot.read(source)].filter((other) => other !== id);
			source = slot.remove(source, moduleNamesFromId(id));
			assert.deepEqual(
				[...slot.read(source)].sort(),
				rest.sort(),
				`${slot.label} drops ${id}`,
			);
		}
		const inserted = slot.insert(source, pageProbe);
		assert.deepEqual([...slot.read(inserted)], [pageProbe.id], slot.label);
		/* An emptied list still ends in a trailing comma: no second one before the new entry. */
		assert.doesNotMatch(
			inserted,
			/,\s*,/,
			`${slot.label}: one comma per entry`,
		);
	}
});

test("an entry after a one-line list gets the comma Biome left out", () => {
	const wiring = wiringSlots(repo);
	const modulesArray = wiring.page.find(
		(slot) => slot.file === wiring.files.modulesArray,
	);
	assert.ok(modulesArray);
	const after = modulesArray.insert(
		'export const moduleTypes = [{ type: "module.hero" }];\n',
		pageProbe,
	);
	assert.match(
		after,
		/\{ type: "module\.hero" \},\n {2}\{ type: "module\.pageProbe" \},\]/,
	);
});

/**
 * Adds a module to a copy the way `gen:module` would: its three files, as stubs `check:wiring`
 * accepts, and an entry in every slot of the page stack and, with `inline`, of rich text.
 *
 * @param {string} dir @param {import("../src/manifest.mjs").ModuleNames} mod
 * @param {{ inline?: boolean }} [options]
 */
async function addFixtureModule(dir, mod, { inline = false } = {}) {
	const wiring = wiringSlots(dir);
	const files = wiring.moduleFiles(mod);
	await writeFile(
		files.schema,
		`import { defineType } from "sanity";\n\nexport const ${mod.schemaVar} = defineType({\n  name: "${mod.id}",\n  type: "object",\n  fields: [],\n});\n`,
	);
	await writeFile(
		files.component,
		`export function ${mod.component}() {\n\treturn null;\n}\n`,
	);
	await writeFile(
		files.query,
		`export const ${mod.queryVar} = \`_type == "${mod.id}" => {}\`;\n`,
	);
	for (const slot of [
		...wiring.required,
		...wiring.page,
		...(inline ? wiring.inline : []),
	]) {
		await writeFile(
			slot.file,
			slot.insert(await readFile(slot.file, "utf8"), mod),
		);
	}
}

/**
 * A copy of just the files `check:wiring` reads, plus `pageProbe` and `inlineProbe`, with an
 * edit applied to each file named.
 */
async function checkWithEdits(
	/** @type {import("node:test").TestContext} */ t,
	/** @type {Record<string, (source: string) => string>} */ edits,
) {
	const dir = await mkdtemp(join(tmpdir(), "check-wiring-"));
	t.after(() => rm(dir, { recursive: true, force: true }));
	for (const sub of [
		"studio/schemas",
		"web/src/components",
		"web/sanity/queries",
	]) {
		await cp(join(repo, sub), join(dir, sub), { recursive: true });
	}
	await addFixtureModule(dir, pageProbe);
	await addFixtureModule(dir, inlineProbe, { inline: true });
	for (const [file, edit] of Object.entries(edits)) {
		const target = join(dir, file);
		const source = await readFile(target, "utf8");
		const edited = edit(source);
		assert.notEqual(edited, source, `the edit changed ${file}`);
		await writeFile(target, edited);
	}
	return spawnSync(process.execPath, [checkWiring, "--root", dir], {
		encoding: "utf8",
	});
}

/** `checkWithEdits` for one file. */
function checkWithEdit(
	/** @type {import("node:test").TestContext} */ t,
	/** @type {string} */ file,
	/** @type {(source: string) => string} */ edit,
) {
	return checkWithEdits(t, { [file]: edit });
}

/** Edits that take `pageProbe` out of every page-stack slot. */
function pageProbeLeavesThePageStack() {
	return Object.fromEntries(
		wiringSlots(repo).page.map((slot) => [
			relative(repo, slot.file),
			(/** @type {string} */ s) => slot.remove(s, pageProbe),
		]),
	);
}

test("the fixture modules are wired", async (t) => {
	const result = await checkWithEdits(t, {});
	assert.equal(result.status, 0, result.stdout);
	assert.match(result.stdout, /✓ module\.pageProbe\n/);
	assert.match(result.stdout, /✓ module\.inlineProbe \(inline\)\n/);
});

test("a module missing from modulesQuery fails, even with its import left", async (t) => {
	const result = await checkWithEdit(
		t,
		"web/sanity/queries/components/modules/index.ts",
		(s) => s.replace(/,\s*\$\{modulePageProbeQuery\}/, ""),
	);
	assert.equal(result.status, 1);
	assert.match(result.stdout, /✗ module\.pageProbe\n.*modulesQuery/);
});

test("a slot entry without a schema is stale", async (t) => {
	const result = await checkWithEdit(
		t,
		"studio/schemas/fields/modulesArrayField.ts",
		(s) =>
			s.replace(
				`{ type: "${pageProbe.id}" }`,
				`{ type: "${pageProbe.id}" },\n  { type: "module.gone" }`,
			),
	);
	assert.equal(result.status, 1);
	assert.match(result.stdout, /lists "module\.gone", which has no schema/);
});

test("an inline module needs all three places", async (t) => {
	const result = await checkWithEdit(
		t,
		"web/sanity/queries/components/text/richTextMedia.ts",
		(s) => s.replace(/,\s*\$\{moduleInlineProbeQuery\}/, ""),
	);
	assert.equal(result.status, 1);
	assert.match(
		result.stdout,
		/✗ module\.inlineProbe \(inline\)\n.*richTextMediaQuery/,
	);
});

test("a module neither in the page stack nor inline is unused", async (t) => {
	const result = await checkWithEdits(t, pageProbeLeavesThePageStack());
	assert.equal(result.status, 1);
	assert.match(result.stdout, /✗ module\.pageProbe\n.*unused/);
});

test("a module only inside another module fails", async (t) => {
	const result = await checkWithEdits(t, {
		...pageProbeLeavesThePageStack(),
		"studio/schemas/objects/modules/moduleInlineProbe.ts": (s) =>
			s.replace(
				"fields: [],",
				`fields: [{ name: "items", type: "array", of: [{ type: "${pageProbe.id}" }] }],`,
			),
	});
	assert.equal(result.status, 1);
	assert.match(
		result.stdout,
		/✗ module\.pageProbe\n.*only inside another module/,
	);
});
