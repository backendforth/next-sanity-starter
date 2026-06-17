/**
 * Dependabot scanner — deterministic pre-filter (no LLM here).
 *
 * Finds open Dependabot PRs that are:
 *   - a MAJOR version bump (patch/minor are handled by dependabot-auto-merge.yml),
 *   - have green CI (no failing / pending checks),
 *   - not already reviewed by us (no `<!-- claude-dep-review -->` marker comment).
 *
 * Emits the candidate list as a GITHUB_OUTPUT `candidates` (JSON) + `count`.
 * The research + decision steps only run when count > 0, so quiet hours cost nothing.
 *
 * Env: GITHUB_TOKEN, GITHUB_REPOSITORY (owner/repo).
 */

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const MARKER = "<!-- claude-dep-review -->";

if (!TOKEN || !REPO) {
	console.error("missing GITHUB_TOKEN or GITHUB_REPOSITORY");
	process.exit(1);
}

async function gh(path) {
	const res = await fetch(`https://api.github.com${path}`, {
		headers: {
			Authorization: `Bearer ${TOKEN}`,
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});
	if (!res.ok)
		throw new Error(`GET ${path} → ${res.status} ${await res.text()}`);
	return res.json();
}

// "Bump foo from 1.2.3 to 2.0.0" / "chore(deps): bump @scope/foo from 1.2.3 to 2.0.0"
function parseBump(title) {
	const m = title.match(
		/bump\s+(\S+)\s+from\s+v?(\d+)\.\d+\.\d+\S*\s+to\s+v?(\d+)\.\d+\.\d+\S*/i,
	);
	if (!m) return null; // grouped PRs ("bump the x group") won't match → skipped
	const [, name, fromMajor, toMajor] = m;
	const isMajor = fromMajor !== toMajor;
	const fromVer = title.match(/from\s+v?(\d+\.\d+\.\d+\S*)/i)?.[1];
	const toVer = title.match(/to\s+v?(\d+\.\d+\.\d+\S*)/i)?.[1];
	return { name, fromVer, toVer, isMajor };
}

// CI is "green" only if nothing is failing AND nothing is still running.
async function ciState(headSha) {
	const checks = await gh(
		`/repos/${REPO}/commits/${headSha}/check-runs?per_page=100`,
	);
	for (const run of checks.check_runs || []) {
		if (run.status !== "completed") return "pending";
		if (!["success", "neutral", "skipped"].includes(run.conclusion))
			return "failing";
	}
	// Legacy commit statuses (e.g. Netlify deploy preview).
	const status = await gh(`/repos/${REPO}/commits/${headSha}/status`);
	if (status.state === "failure" || status.state === "error") return "failing";
	if (status.state === "pending") return "pending";
	return "green";
}

async function alreadyReviewed(number) {
	const comments = await gh(
		`/repos/${REPO}/issues/${number}/comments?per_page=100`,
	);
	return comments.some((c) => (c.body || "").includes(MARKER));
}

const pulls = await gh(`/repos/${REPO}/pulls?state=open&per_page=100`);
const candidates = [];

for (const pr of pulls) {
	if (pr.user?.login !== "dependabot[bot]") continue;
	const bump = parseBump(pr.title);
	if (!bump?.isMajor) continue; // only single-package majors
	const ci = await ciState(pr.head.sha);
	if (ci !== "green") {
		console.log(
			`#${pr.number} ${bump.name} ${bump.fromVer}→${bump.toVer}: CI ${ci}, skip`,
		);
		continue;
	}
	if (await alreadyReviewed(pr.number)) {
		console.log(`#${pr.number} ${bump.name}: already reviewed, skip`);
		continue;
	}
	candidates.push({
		number: pr.number,
		title: pr.title,
		url: pr.html_url,
		package: bump.name,
		fromVersion: bump.fromVer,
		toVersion: bump.toVer,
	});
	console.log(
		`#${pr.number} ${bump.name} ${bump.fromVer}→${bump.toVer}: CANDIDATE`,
	);
}

console.log(`\n${candidates.length} candidate(s).`);

if (process.env.GITHUB_OUTPUT) {
	const { appendFileSync } = await import("node:fs");
	appendFileSync(
		process.env.GITHUB_OUTPUT,
		`count=${candidates.length}\ncandidates=${JSON.stringify(candidates)}\n`,
	);
}
