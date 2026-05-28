/**
 * **Synchronous** `projectId` + `dataset` for code that may run in the **browser** (e.g.
 * `sanityImageBuilder` used under Client Components). No top-level `await`.
 *
 * The GROQ `client` in `client.ts` still uses async resolution in `sanityEnv.ts` — keep env
 * aligned so image URLs match API queries (set `SANITY_STUDIO_DATASET` or pin both places).
 *
 * Reads `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` directly. These are inlined
 * into the **client** bundle by `next.config.ts`'s `env` map (Next normally only inlines
 * `NEXT_PUBLIC_*`) so server and client always compute identical URLs — otherwise SSR
 * transforms (`?w=…&auto=format&q=85`) but the hydrating client falls back to bare
 * `asset.url`, producing hydration mismatches on every Sanity image.
 */
export const syncSanityProjectId: string =
	process.env.SANITY_STUDIO_PROJECT_ID?.trim() || "";

function syncDataset(): string {
	const explicit = process.env.SANITY_STUDIO_DATASET?.trim();
	if (explicit) {
		return explicit;
	}
	/* No explicit dataset → fall back to a name that's identical on server and client.
	   `NODE_ENV` is inlined by Next, so this branch matches on both sides. Set
	   `SANITY_STUDIO_DATASET` (which `next.config.ts` exposes to the browser) for
	   non-default datasets. */
	return process.env.NODE_ENV === "production" ? "production" : "development";
}

export const syncSanityDataset: string = syncDataset();
