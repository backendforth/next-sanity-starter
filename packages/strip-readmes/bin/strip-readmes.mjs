#!/usr/bin/env node
/**
 * Removes every file named README.md under the repo root.
 * Skips dependency and build output dirs. Use after cloning the boilerplate.
 *
 * Usage:
 *   pnpm --filter @repo/strip-readmes run strip
 *   node packages/strip-readmes/bin/strip-readmes.mjs --dry-run
 */
import { readdir, unlink } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SKIP_DIR_NAMES = new Set([
	".git",
	".next",
	".sanity",
	".turbo",
	".vercel",
	"build",
	"coverage",
	"dist",
	"node_modules",
	"out",
]);

const dryRun = process.argv.includes("--dry-run");

// Repo root: packages/strip-readmes/bin/ → ../../../
const root = fileURLToPath(new URL("../../..", import.meta.url));

/** @type {string[]} */
const removed = [];

/**
 * @param {string} dir
 */
async function walk(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const e of entries) {
		const name = e.name;
		const full = join(dir, name);
		if (e.isDirectory()) {
			if (SKIP_DIR_NAMES.has(name)) continue;
			await walk(full);
		} else if (name === "README.md") {
			const rel = relative(root, full) || "README.md";
			if (dryRun) {
				console.log(`would remove: ${rel}`);
			} else {
				await unlink(full);
				console.log(`removed: ${rel}`);
			}
			removed.push(rel);
		}
	}
}

await walk(root);

if (removed.length === 0) {
	console.log(
		dryRun ? "No README.md files found." : "No README.md files to remove.",
	);
} else {
	console.log(
		dryRun
			? `\n${removed.length} file(s) would be removed (run without --dry-run to delete).`
			: `\nDone. ${removed.length} README.md file(s) removed.`,
	);
}
