// @ts-check
/**
 * End to end: scaffold two modules — one of them inline — into a copy of this checkout, or clear
 * the page stack and scaffold its first module, then run what `pnpm generate` and CI run: schema
 * extract and typegen, `check:typegen`, `check:wiring` and `tsc` for web and studio. The copy
 * shares this checkout's `node_modules` through symlinks.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdtemp, readdir, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../../..", import.meta.url));
const SKIP =
	/(^|\/)(node_modules|\.next|dist|\.git|\.agent|\.claude|\.turbo)(\/|$)/;

/** @param {string} cwd @param {string} command @param {string[]} args */
function run(cwd, command, args) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: "utf8",
		env: { ...process.env, SANITY_STUDIO_PROJECT_ID: "ci-placeholder" },
	});
	assert.equal(
		result.status,
		0,
		`${command} ${args.join(" ")} (in ${relative(repo, cwd) || "."}) failed:\n${result.stdout}\n${result.stderr}`,
	);
	return result.stdout;
}

/* Names no project picks, since `pnpm test:tooling` runs in every project built from this. */
const scaffold = join(repo, "packages/scaffold-module/bin/scaffold-module.mjs");
const clear = join(repo, "packages/scaffold-module/bin/clear-modules.mjs");

/** A copy of this checkout that shares its `node_modules`. @param {import("node:test").TestContext} t */
async function copyCheckout(t) {
	const dir = await mkdtemp(join(tmpdir(), "scaffold-e2e-"));
	t.after(() => rm(dir, { recursive: true, force: true }));

	await cp(repo, dir, {
		recursive: true,
		filter: (src) => !SKIP.test(relative(repo, src)),
	});
	const packages = (await readdir(join(repo, "packages"))).map((p) =>
		join("packages", p),
	);
	for (const sub of ["", "studio", "web", ...packages]) {
		const modules = join(repo, sub, "node_modules");
		if (existsSync(modules))
			await symlink(modules, join(dir, sub, "node_modules"), "dir");
	}
	return dir;
}

/** Generate, check typegen and wiring, typecheck both apps; returns the wiring report. @param {string} dir */
function generateAndCheck(dir) {
	run(join(dir, "studio"), "pnpm", ["run", "generate"]);
	run(join(dir, "web"), "pnpm", ["run", "generate"]);

	const checks = join(repo, "packages/check-wiring/bin");
	run(repo, process.execPath, [
		join(checks, "check-typegen.mjs"),
		"--root",
		dir,
	]);
	const wiring = run(repo, process.execPath, [
		join(checks, "check-wiring.mjs"),
		"--root",
		dir,
	]);

	for (const app of ["web", "studio"]) {
		run(join(dir, app), "pnpm", ["run", "typecheck"]);
	}
	return wiring;
}

test("two scaffolded modules, one inline, generate, wire and typecheck", {
	timeout: 300_000,
}, async (t) => {
	const dir = await copyCheckout(t);
	run(repo, process.execPath, [scaffold, "--root", dir, "ScaffoldProbe"]);
	run(repo, process.execPath, [
		scaffold,
		"--root",
		dir,
		"ScaffoldInlineProbe",
		"--inline",
	]);

	const wiring = generateAndCheck(dir);
	assert.match(wiring, /✓ module\.scaffoldProbe\n/);
	assert.match(wiring, /✓ module\.scaffoldInlineProbe \(inline\)/);
});

test("a cleared page stack compiles, then takes one module after another", {
	timeout: 300_000,
}, async (t) => {
	const dir = await copyCheckout(t);
	run(repo, process.execPath, [clear, "--root", dir]);
	assert.equal(
		existsSync(join(dir, "web/src/components/modules/ContentRefList.tsx")),
		false,
		"a helper only a deleted module imports goes with it",
	);

	/* Only inline modules are left: no `✓` line without "(inline)". */
	assert.doesNotMatch(generateAndCheck(dir), /✓ module\.\w+\n/);

	const modulesArray = join(dir, "studio/schemas/fields/modulesArrayField.ts");
	run(repo, process.execPath, [scaffold, "--root", dir, "ScaffoldProbe"]);
	/* Biome writes a one-entry list on one line, without a trailing comma. */
	assert.match(
		await readFile(modulesArray, "utf8"),
		/moduleTypes = \[\{ type: "module\.scaffoldProbe" \}\];/,
	);
	run(repo, process.execPath, [
		scaffold,
		"--root",
		dir,
		"ScaffoldInlineProbe",
		"--inline",
	]);

	const wiring = generateAndCheck(dir);
	assert.match(wiring, /✓ module\.scaffoldProbe\n/);
	assert.match(wiring, /✓ module\.scaffoldInlineProbe \(inline\)/);
	assert.deepEqual(
		[
			...(await readFile(modulesArray, "utf8")).matchAll(
				/type: "(module\.\w+)"/g,
			),
		].map((m) => m[1]),
		["module.scaffoldProbe", "module.scaffoldInlineProbe"],
	);
});

test("a missing anchor aborts before anything is written", async (t) => {
	const dir = await mkdtemp(join(tmpdir(), "scaffold-abort-"));
	t.after(() => rm(dir, { recursive: true, force: true }));
	await cp(join(repo, "studio/schemas"), join(dir, "studio/schemas"), {
		recursive: true,
	});
	await cp(
		join(repo, "web/src/components/modules"),
		join(dir, "web/src/components/modules"),
		{ recursive: true },
	);

	const result = spawnSync(
		process.execPath,
		[scaffold, "--root", dir, "ScaffoldProbe"],
		{ encoding: "utf8" },
	);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /Nothing was written/);
	assert.equal(
		existsSync(
			join(dir, "studio/schemas/objects/modules/moduleScaffoldProbe.ts"),
		),
		false,
	);
	assert.equal(
		existsSync(join(dir, "web/src/components/modules/ModuleScaffoldProbe.tsx")),
		false,
	);
});
