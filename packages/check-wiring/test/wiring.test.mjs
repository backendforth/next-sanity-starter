// @ts-check
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
	const hero = moduleNames("Hero");
	for (const slot of [...wiring.required, ...wiring.page]) {
		const source = await readFile(slot.file, "utf8");
		const before = slot.read(source);
		assert.ok(before.has("module.text"), `${slot.label} reads module.text`);
		const after = slot.read(slot.insert(source, hero));
		assert.deepEqual(
			[...after].sort(),
			[...before, hero.id].sort(),
			slot.label,
		);
	}
	for (const slot of wiring.inline) {
		const source = await readFile(slot.file, "utf8");
		assert.ok(slot.read(slot.insert(source, hero)).has(hero.id), slot.label);
	}
});

test("every slot drops its modules one by one, then takes a new one", async () => {
	const wiring = wiringSlots(repo);
	const hero = moduleNames("Hero");
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
		assert.deepEqual(
			[...slot.read(slot.insert(source, hero))],
			[hero.id],
			slot.label,
		);
	}
});

/** A copy of just the files `check:wiring` reads, with an edit applied to each file named. */
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

test("a module missing from modulesQuery fails, even with its import left", async (t) => {
	const result = await checkWithEdit(
		t,
		"web/sanity/queries/components/modules/index.ts",
		(s) => s.replace(`,\n  \${moduleContentRefsQuery}`, ""),
	);
	assert.equal(result.status, 1);
	assert.match(result.stdout, /✗ module\.contentRefs\n.*modulesQuery/);
});

test("a slot entry without a schema is stale", async (t) => {
	const result = await checkWithEdit(
		t,
		"studio/schemas/fields/modulesArrayField.ts",
		(s) =>
			s.replace(
				`{ type: "module.text" },`,
				`{ type: "module.text" },\n  { type: "module.gone" },`,
			),
	);
	assert.equal(result.status, 1);
	assert.match(result.stdout, /lists "module\.gone", which has no schema/);
});

test("an inline module needs all three places", async (t) => {
	const result = await checkWithEdit(
		t,
		"web/sanity/queries/components/text/richTextMedia.ts",
		(s) => s.replace(`,\n    \${moduleCarouselQuery}`, ""),
	);
	assert.equal(result.status, 1);
	assert.match(
		result.stdout,
		/✗ module\.carousel \(inline\)\n.*richTextMediaQuery/,
	);
});

test("a module neither in the page stack nor inline is unused", async (t) => {
	const result = await checkWithEdits(t, {
		"studio/schemas/fields/modulesArrayField.ts": (s) =>
			s.replace(`\n  { type: "module.contentRefs" },`, ""),
		"web/src/components/modules/ModulesRenderer.tsx": (s) =>
			s.replace(`case "module.contentRefs":`, ""),
		"web/sanity/queries/components/modules/index.ts": (s) =>
			s.replace(`,\n  \${moduleContentRefsQuery}`, ""),
	});
	assert.equal(result.status, 1);
	assert.match(result.stdout, /✗ module\.contentRefs\n.*unused/);
});

test("a module only inside another module fails", async (t) => {
	const result = await checkWithEdits(t, {
		"studio/schemas/fields/modulesArrayField.ts": (s) =>
			s.replace(
				/\n {2}defineArrayMember\(\{\n {4}type: "module\.media",[\s\S]*?\}\),/,
				"",
			),
		"web/src/components/modules/ModulesRenderer.tsx": (s) =>
			s.replace(`case "module.media":`, ""),
		"web/sanity/queries/components/modules/index.ts": (s) =>
			s.replace(`\n  \${moduleMediaQuery},`, ""),
		"studio/schemas/objects/editors/richTextMedia.ts": (s) =>
			s.replace(
				/\n {4}defineArrayMember\(\{\n {6}type: "module\.media",[\s\S]*?\n {4}\}\),/,
				"",
			),
		"web/sanity/queries/components/text/richTextMedia.ts": (s) =>
			s.replace(`\n    \${moduleMediaQuery},`, ""),
		"web/src/components/text/portableTextComponents.tsx": (s) =>
			s.replace(`"module.media": ({ value })`, `media: ({ value })`),
	});
	assert.equal(result.status, 1);
	assert.match(result.stdout, /✗ module\.media\n.*only inside another module/);
});
