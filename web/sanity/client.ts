import { createClient } from "next-sanity";

import { dataset, projectId } from "./sanityEnv";

/**
 * When Sanity env vars are missing (e.g. a fresh clone, CI smoke build, Netlify deploy preview
 * without secrets), we must **not** throw at module load — that would break the default
 * `/_not-found` page collection during `next build`, even for pages that never fetch from
 * Sanity. Instead we warn loudly and construct a placeholder client; any real `.fetch()` call
 * will then surface a clear error at runtime. Routes that touch Sanity must provide the real env.
 */
const hasSanityConfig = Boolean(projectId && dataset);

if (!hasSanityConfig) {
	const isBuild = process.env.NEXT_PHASE === "phase-production-build";
	const missing: string[] = [];
	if (!projectId) missing.push("SANITY_STUDIO_PROJECT_ID");
	if (!dataset) missing.push("SANITY_STUDIO_DATASET (or dataset resolution)");
	console.error(
		`[sanity] Missing ${missing.join(" and ")} — using a placeholder Sanity client so the ${
			isBuild ? "build" : "process"
		} can proceed. Actual queries will fail until env is configured. See studio/.env.example.`,
	);
}

/** Edge-cached API reads in production; set `SANITY_USE_CDN=false` for always-fresh data (e.g. debugging). */
function sanityUseCdn(): boolean {
	if (process.env.SANITY_USE_CDN === "false") {
		return false;
	}
	if (process.env.SANITY_USE_CDN === "true") {
		return true;
	}
	return process.env.NODE_ENV === "production";
}

export const client = createClient({
	/** Placeholder keeps `createClient` from throwing; real fetches fail loudly at runtime. */
	projectId: projectId || "placeholder",
	dataset: dataset || "production",
	apiVersion: "2024-01-01",
	useCdn: sanityUseCdn(),
	stega: {
		studioUrl:
			process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? "http://localhost:3333",
	},
});

/** True when a real Sanity project id + dataset are configured. Data-fetching helpers can short-circuit. */
export const isSanityConfigured = hasSanityConfig;
