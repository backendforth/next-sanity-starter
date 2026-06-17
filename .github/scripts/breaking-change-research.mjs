/**
 * Breaking-change research — runs on a cheap model via OpenRouter (Gemini Flash).
 *
 * For each candidate PR it gathers REAL data (npm registry → GitHub release notes
 * between the two versions) and asks the model to summarise breaking changes.
 * Honesty rule: if it can't gather release notes, it reports low data quality so
 * the decision step treats the PR as UNSAFE (never auto-merge on a guess).
 *
 * Reads candidates from env CANDIDATES (JSON array from dependabot-scan.mjs).
 * Writes a JSON array of reports to stdout.
 *
 * Env: OPENROUTER_API_KEY, OPENROUTER_MODEL (default google/gemini-3.5-flash),
 *      GITHUB_TOKEN (for higher GitHub API rate limits).
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-3.5-flash";
const GH_TOKEN = process.env.GITHUB_TOKEN;
const candidates = JSON.parse(process.env.CANDIDATES || "[]");

if (!OPENROUTER_API_KEY) {
	console.error("missing OPENROUTER_API_KEY");
	process.exit(1);
}

function ghHeaders() {
	const h = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};
	if (GH_TOKEN) h.Authorization = `Bearer ${GH_TOKEN}`;
	return h;
}

// npm package → { owner, repo } on GitHub, if discoverable.
async function resolveRepo(pkg) {
	try {
		const res = await fetch(
			`https://registry.npmjs.org/${encodeURIComponent(pkg)}`,
		);
		if (!res.ok) return null;
		const data = await res.json();
		const url = data.repository?.url || data.homepage || "";
		const m = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git|\/|$)/i);
		return m ? { owner: m[1], repo: m[2] } : null;
	} catch {
		return null;
	}
}

// Collect release-note bodies for versions in (from, to].
async function fetchReleaseNotes({ owner, repo }, fromVersion, toVersion) {
	try {
		const res = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`,
			{ headers: ghHeaders() },
		);
		if (!res.ok) return [];
		const releases = await res.json();
		const norm = (t) => (t || "").replace(/^.*?v?(\d+\.\d+\.\d+\S*)$/, "$1");
		const cmp = (a, b) => {
			const pa = a.split(/[.\-+]/).map((n) => Number.parseInt(n, 10) || 0);
			const pb = b.split(/[.\-+]/).map((n) => Number.parseInt(n, 10) || 0);
			for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
			return 0;
		};
		return releases
			.map((r) => ({ v: norm(r.tag_name), body: r.body || "" }))
			.filter(
				(r) => r.v && cmp(r.v, fromVersion) > 0 && cmp(r.v, toVersion) <= 0,
			)
			.map((r) => `## ${r.v}\n${r.body}`.slice(0, 4000));
	} catch {
		return [];
	}
}

async function assess(candidate, notes) {
	const haveData = notes.length > 0;
	const system =
		"You analyse dependency upgrades for breaking changes. Be conservative: " +
		"if the provided release notes are missing or insufficient to be sure, set " +
		'dataQuality to "low" and hasBreakingChanges to true. Only respond with JSON.';
	const user = [
		`Package: ${candidate.package}`,
		`Upgrade: ${candidate.fromVersion} → ${candidate.toVersion} (major)`,
		"",
		haveData
			? `Release notes between these versions:\n\n${notes.join("\n\n")}`
			: "No release notes could be fetched for this package.",
		"",
		'Respond with JSON: {"hasBreakingChanges": boolean, "dataQuality": "high"|"medium"|"low", ' +
			'"summary": string, "breakingChanges": string[], "migrationNotes": string}',
	].join("\n");

	const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${OPENROUTER_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: MODEL,
			temperature: 0.1,
			response_format: { type: "json_object" },
			messages: [
				{ role: "system", content: system },
				{ role: "user", content: user },
			],
		}),
	});
	if (!res.ok) throw new Error(`openrouter ${res.status}: ${await res.text()}`);
	const data = await res.json();
	const content = data.choices?.[0]?.message?.content || "{}";
	let parsed;
	try {
		parsed = JSON.parse(content);
	} catch {
		// If the model didn't return clean JSON, fail safe.
		parsed = {
			hasBreakingChanges: true,
			dataQuality: "low",
			summary: content.slice(0, 500),
		};
	}
	return { ...parsed, hadReleaseNotes: haveData };
}

const reports = [];
for (const c of candidates) {
	const repo = await resolveRepo(c.package);
	const notes = repo
		? await fetchReleaseNotes(repo, c.fromVersion, c.toVersion)
		: [];
	const report = await assess(c, notes);
	reports.push({ number: c.number, package: c.package, ...report });
	console.error(
		`#${c.number} ${c.package}: breaking=${report.hasBreakingChanges} quality=${report.dataQuality}`,
	);
}

process.stdout.write(JSON.stringify(reports, null, 2));
