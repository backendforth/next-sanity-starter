/**
 * Breaking-change council — N independent "council members" (Gemini 3.1 Flash
 * Lite via OpenRouter) deliberate, in two rounds, over Claude's evaluation of a
 * Dependabot MAJOR dependency PR. Claude (the analyst + chair) runs this script
 * and reads its JSON verdict; the council members do NOT see the codebase, only
 * Claude's analysis + proposed fixes.
 *
 * Usage:  node council.mjs <path-to-claude-eval>
 *   The eval file is whatever Claude wrote (JSON or markdown) — its
 *   breaking-change analysis, affected code, and proposed migration fixes.
 *   It is passed to the members verbatim.
 *
 * Env: OPENROUTER_API_KEY (required),
 *      COUNCIL_MODEL (default google/gemini-3.1-flash-lite),
 *      COUNCIL_SIZE (default 4).
 *
 * Output: a JSON verdict to stdout (Claude reads + summarises it). Progress goes
 * to stderr so it doesn't pollute stdout.
 */

import { readFileSync } from "node:fs";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.COUNCIL_MODEL || "google/gemini-3.1-flash-lite";
const SIZE = Math.max(1, Number.parseInt(process.env.COUNCIL_SIZE || "4", 10));

if (!OPENROUTER_API_KEY) {
	console.error("missing OPENROUTER_API_KEY");
	process.exit(1);
}

const evalPath = process.argv[2];
if (!evalPath) {
	console.error("usage: node council.mjs <path-to-claude-eval>");
	process.exit(1);
}
const evaluation = readFileSync(evalPath, "utf8");

// Distinct lenses so the members reason from genuinely different angles.
const PERSONAS = [
	"a pragmatic senior engineer focused on shipping safely",
	"a skeptical reviewer who hunts for hidden breakage and edge cases",
	"a maintenance-minded engineer weighing long-term API churn and cost",
	"a test/CI-focused engineer asking whether existing coverage catches regressions",
];

const SCHEMA =
	'{"verdict":"merge"|"hold"|"needs-changes","confidence":0..1,' +
	'"risks":string[],"conditions":string[],"reasoning":string}';

async function ask(messages) {
	const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${OPENROUTER_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: MODEL,
			temperature: 0.3,
			response_format: { type: "json_object" },
			messages,
		}),
	});
	if (!res.ok) throw new Error(`openrouter ${res.status}: ${await res.text()}`);
	const data = await res.json();
	const content = data.choices?.[0]?.message?.content || "{}";
	try {
		return JSON.parse(content);
	} catch {
		return {
			verdict: "hold",
			confidence: 0,
			risks: [],
			conditions: [],
			reasoning: content.slice(0, 400),
		};
	}
}

// Round 1 — independent assessments.
const round1 = [];
for (let i = 0; i < SIZE; i++) {
	const persona = PERSONAS[i % PERSONAS.length];
	const r = await ask([
		{
			role: "system",
			content:
				`You are council member #${i + 1}, ${persona}. Decide whether a Dependabot ` +
				"MAJOR dependency upgrade is safe to merge, based on Claude's breaking-change " +
				`analysis and proposed migration fixes. Be concrete and conservative. Respond ONLY as JSON: ${SCHEMA}`,
		},
		{
			role: "user",
			content: `Claude's analysis + proposed fixes:\n\n${evaluation}`,
		},
	]);
	round1.push({ member: i + 1, persona, ...r });
	console.error(`round1 #${i + 1}: ${r.verdict} (conf ${r.confidence})`);
}

// Round 2 — deliberation: each member sees the others' first-round views.
const peers = round1
	.map(
		(m) =>
			`Member #${m.member} (${m.persona}): ${JSON.stringify({
				verdict: m.verdict,
				risks: m.risks,
				conditions: m.conditions,
				reasoning: m.reasoning,
			})}`,
	)
	.join("\n\n");

const finalVotes = [];
for (let i = 0; i < SIZE; i++) {
	const me = round1[i];
	const r = await ask([
		{
			role: "system",
			content:
				`You are council member #${me.member}, ${me.persona}. After reading the other ` +
				`members' first-round assessments you give your FINAL vote — you may change your ` +
				`mind. Respond ONLY as JSON: ${SCHEMA}`,
		},
		{
			role: "user",
			content:
				`Claude's analysis + fixes:\n\n${evaluation}\n\n---\n` +
				`The council's first-round assessments:\n\n${peers}\n\n---\n` +
				`Your own first round was: ${JSON.stringify({ verdict: me.verdict, reasoning: me.reasoning })}. ` +
				"Now give your final vote.",
		},
	]);
	finalVotes.push({ member: me.member, persona: me.persona, ...r });
	console.error(`round2 #${me.member}: ${r.verdict} (conf ${r.confidence})`);
}

// Aggregate.
const tally = finalVotes.reduce((acc, m) => {
	acc[m.verdict] = (acc[m.verdict] || 0) + 1;
	return acc;
}, {});
const majorityVerdict =
	Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || "hold";

process.stdout.write(
	JSON.stringify(
		{
			model: MODEL,
			size: SIZE,
			tally,
			majorityVerdict,
			risks: [...new Set(finalVotes.flatMap((m) => m.risks || []))],
			conditions: [...new Set(finalVotes.flatMap((m) => m.conditions || []))],
			finalVotes: finalVotes.map((m) => ({
				member: m.member,
				persona: m.persona,
				verdict: m.verdict,
				confidence: m.confidence,
				reasoning: m.reasoning,
			})),
		},
		null,
		2,
	),
);
