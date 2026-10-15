// @ts-check
/**
 * End to end: scaffold two modules — one of them inline — into a copy of this checkout, then
 * run what `pnpm generate` and CI run: both typegens, `check:typegen`, `check:wiring` and
 * `tsc` for web and studio. The copy shares this checkout's `node_modules` through symlinks.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdtemp, readdir, rm, symlink } from "node:fs/promises";
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

test("two scaffolded modules, one inline, generate, wire and typecheck", {
	timeout: 300_000,
}, async (t) => {
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

	const scaffold = join(
		repo,
		"packages/scaffold-module/bin/scaffold-module.mjs",
	);
	run(repo, process.execPath, [scaffold, "--root", dir, "Hero"]);
	run(repo, process.execPath, [scaffold, "--root", dir, "Quote", "--inline"]);

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
	assert.match(wiring, /✓ module\.hero\n/);
	assert.match(wiring, /✓ module\.quote \(inline\)/);

	for (const app of ["web", "studio"]) {
		run(join(dir, app), "pnpm", ["run", "typecheck"]);
	}
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

	const scaffold = join(
		repo,
		"packages/scaffold-module/bin/scaffold-module.mjs",
	);
	const result = spawnSync(
		process.execPath,
		[scaffold, "--root", dir, "Hero"],
		{ encoding: "utf8" },
	);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /Nothing was written/);
	assert.equal(
		existsSync(join(dir, "studio/schemas/objects/modules/moduleHero.ts")),
		false,
	);
	assert.equal(
		existsSync(join(dir, "web/src/components/modules/ModuleHero.tsx")),
		false,
	);
});
