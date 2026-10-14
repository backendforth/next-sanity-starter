// @ts-check
/**
 * First-load JS per route of the web build, gzipped — the number the browser downloads before
 * a page is interactive.
 *
 * Usage:  node .github/scripts/bundle-report.mjs   (after `pnpm --filter web run build`)
 *
 * Reads `web/.next/diagnostics/route-bundle-stats.json`, which `next build` writes with the
 * chunk list of every route, and gzips each chunk (level 9). Writes a Markdown table to
 * `$GITHUB_STEP_SUMMARY` when set (the `build (web)` job), to stdout otherwise.
 *
 * Budget gate: `.github/bundle-budget.json` maps routes to a ceiling in KB gzip. A route over
 * its ceiling fails the run (exit 1) after the table is written; a route without one only
 * shows `—`.
 */

import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const webDir = fileURLToPath(new URL("../../web", import.meta.url));
const statsFile = join(webDir, ".next/diagnostics/route-bundle-stats.json");
const budgetFile = fileURLToPath(
	new URL("../bundle-budget.json", import.meta.url),
);

/** @type {Record<string, number>} route → ceiling in KB gzip */
const budgets = JSON.parse(readFileSync(budgetFile, "utf8")).routes;

/** @type {{ route: string; firstLoadChunkPaths: string[] }[]} */
const routes = JSON.parse(readFileSync(statsFile, "utf8"));

/** @type {Map<string, { raw: number; gzip: number }>} */
const chunkSizes = new Map();
/** @param {string} chunk */
function sizeOf(chunk) {
	let size = chunkSizes.get(chunk);
	if (!size) {
		const source = readFileSync(join(webDir, chunk));
		size = { raw: source.length, gzip: gzipSync(source, { level: 9 }).length };
		chunkSizes.set(chunk, size);
	}
	return size;
}

/** @param {number} bytes */
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const rows = routes.map(({ route, firstLoadChunkPaths }) => {
	let raw = 0;
	let gzip = 0;
	for (const chunk of firstLoadChunkPaths) {
		const size = sizeOf(chunk);
		raw += size.raw;
		gzip += size.gzip;
	}
	const budget = budgets[route];
	const over = budget !== undefined && gzip / 1024 > budget;
	return { route, chunks: firstLoadChunkPaths.length, raw, gzip, budget, over };
});

const table = [
	"### First-load JS per route",
	"",
	"| Route | Chunks | Raw | Gzip | Budget |",
	"|---|---:|---:|---:|---:|",
	...rows.map(
		(row) =>
			`| \`${row.route}\` | ${row.chunks} | ${kb(row.raw)} | **${kb(row.gzip)}** | ${
				row.budget === undefined
					? "—"
					: `${row.over ? "❌" : "✅"} ${row.budget} KB`
			} |`,
	),
	"",
].join("\n");

const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary) appendFileSync(summary, `${table}\n`);
else console.log(table);

const overBudget = rows.filter((row) => row.over);
for (const row of overBudget) {
	console.error(
		`✗ ${row.route}: ${kb(row.gzip)} gzip exceeds its ${row.budget} KB budget (.github/bundle-budget.json).`,
	);
}
if (overBudget.length > 0) process.exit(1);
