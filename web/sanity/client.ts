import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, studioUrl, useCdn } from "./sanityEnv";

/**
 * When the project id is missing (e.g. a fresh clone, CI smoke build, Netlify deploy preview
 * without secrets), we must **not** throw at module load — that would break the default
 * `/_not-found` page collection during `next build`, even for pages that never fetch from
 * Sanity. Instead we warn loudly and construct a placeholder client; any real `.fetch()` call
 * will then surface a clear error at runtime. Routes that touch Sanity must provide the real env.
 * The dataset is always set: `next.config.ts` resolves and inlines one.
 */
/** True when a real Sanity project id is configured. Data-fetching helpers can short-circuit. */
export const isSanityConfigured = Boolean(projectId);

if (!isSanityConfigured) {
	const isBuild = process.env.NEXT_PHASE === "phase-production-build";
	console.error(
		`[sanity] Missing SANITY_STUDIO_PROJECT_ID — using a placeholder Sanity client so the ${
			isBuild ? "build" : "process"
		} can proceed. Actual queries will fail until env is configured. See web/.env.example.`,
	);
}

export const client = createClient({
	/** Placeholder keeps `createClient` from throwing; real fetches fail loudly at runtime. */
	projectId: projectId || "placeholder",
	dataset,
	apiVersion,
	useCdn,
	stega: { studioUrl },
});
