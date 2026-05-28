/**
 * **Synchronous** `projectId` + `dataset` for code that may run in the **browser** (e.g.
 * `sanityImageBuilder` used under Client Components). No top-level `await`.
 *
 * The GROQ `client` in `client.ts` still uses async resolution in `sanityEnv.ts` — keep env
 * aligned so image URLs match API queries (set `SANITY_STUDIO_DATASET` or pin both places).
 *
 * In client bundles, Next only inlines **`NEXT_PUBLIC_*`**. We deliberately read **only**
 * `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` here so server and client
 * always compute identical URLs — otherwise SSR transforms (`?w=…&auto=format&q=85`) but
 * the hydrating client falls back to bare `asset.url`, producing hydration mismatches on
 * every Sanity image. If the public vars are unset, both sides degrade to bare `asset.url`
 * (no transformations) but stay consistent.
 */
export const syncSanityProjectId: string =
	process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || "";

function syncDataset(): string {
	const fromPublic = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
	if (fromPublic) {
		return fromPublic;
	}
	/* `SANITY_STUDIO_DATASET` deliberately omitted: it's not inlined into client
	   bundles, so reading it here would diverge from the client and cause image
	   URL mismatches. `NODE_ENV` is inlined by Next, so this final branch matches
	   on both sides. Set `NEXT_PUBLIC_SANITY_DATASET` for non-default datasets. */
	return process.env.NODE_ENV === "production" ? "production" : "development";
}

export const syncSanityDataset: string = syncDataset();
