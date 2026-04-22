import { getSanityStudioProjectId } from "./resolveStudioDataset";

/**
 * **Synchronous** `projectId` + `dataset` for code that may run in the **browser** (e.g.
 * `sanityImageBuilder` used under Client Components). No top-level `await`.
 *
 * The GROQ `client` in `client.ts` still uses async resolution in `sanityEnv.ts` — keep env
 * aligned so image URLs match API queries (set `SANITY_STUDIO_DATASET` or pin both places).
 *
 * In client bundles, Next only inlines **`NEXT_PUBLIC_*`** — prefer
 * **`NEXT_PUBLIC_SANITY_DATASET`** if image URLs must match a non-default dataset in the browser.
 */
export const syncSanityProjectId: string = getSanityStudioProjectId();

function syncDataset(): string {
	const fromPublic = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
	if (fromPublic) {
		return fromPublic;
	}
	const fromStudio = process.env.SANITY_STUDIO_DATASET?.trim();
	if (fromStudio) {
		return fromStudio;
	}
	return process.env.NODE_ENV === "production" ? "production" : "development";
}

export const syncSanityDataset: string = syncDataset();
