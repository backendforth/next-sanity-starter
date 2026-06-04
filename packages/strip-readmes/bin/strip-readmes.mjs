#!/usr/bin/env node
/**
 * Removes nested README.md files under the repo root after cloning the starter.
 * The root-level README.md is preserved so the public-facing repo description
 * survives the strip. Dependency and build output dirs are also skipped.
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
/** @type {string[]} */
const preserved = [];

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
			if (rel === "README.md") {
				preserved.push(rel);
				console.log(`preserved (repo root): ${rel}`);
				continue;
			}
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

const preservedSummary =
	preserved.length > 0 ? ` Preserved ${preserved.length} root README.` : "";

if (removed.length === 0) {
	console.log(
		dryRun
			? `No nested README.md files found.${preservedSummary}`
			: `No nested README.md files to remove.${preservedSummary}`,
	);
} else {
	console.log(
		dryRun
			? `\n${removed.length} file(s) would be removed (run without --dry-run to delete).${preservedSummary}`
			: `\nDone. ${removed.length} README.md file(s) removed.${preservedSummary}`,
	);
}
