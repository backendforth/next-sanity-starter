import { unstable_cache } from "next/cache";
import { cache } from "react";

import { client } from "./client";
import { SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS } from "./documentCacheRevalidateSeconds";
import { homeQuery, pageBySlugQuery } from "./queries";
import type { HomeDocument, PageDocument } from "./types/pages";

export { SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS } from "./documentCacheRevalidateSeconds";

/**
 * **Published-only** reads via `client.fetch` + `unstable_cache` (tags / time-based revalidate).
 * App routes that need **Presentation / Draft Mode / Visual Editing** use
 * `fetchHomeDocument` / `fetchPageBySlug` in `fetchSanityData.ts` (`sanityFetch` from `defineLive`) instead.
 *
 * Static GROQ (no `$params`) — deduped within a request when the same `query`
 * string is reused (e.g. **`generateMetadata`** + page component).
 *
 * For routes with **slug** (or other params), use {@link cachedPageDocumentBySlug}
 * so arguments stay primitives — object params break React `cache` deduplication.
 */
export const cachedSanityQuery = cache(async <T>(query: string) => {
	const data = await client.fetch<T>(query);
	return { data };
});

/**
 * `pageBySlugQuery` with `$slug` — one fetch per slug per request.
 * Use for **`generateMetadata`** and the page (deduped per slug within the request).
 *
 * Combines React `cache()` (per-request) with `unstable_cache` (cross-request).
 * Revalidates via tag `page-{slug}` or time-based after `SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS`.
 */
export const cachedPageDocumentBySlug = cache(async (slug: string) => {
	const fetchPage = unstable_cache(
		async () =>
			client.fetch<PageDocument | null>(pageBySlugQuery, {
				slug,
			}),
		[`page-${slug}`],
		{
			revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
			tags: [`page-${slug}`, "pages"],
		},
	);
	const data = await fetchPage();
	return { data };
});

/** Module-level `unstable_cache` so Next can treat the home route as prerendered + ISR (see `[locale]/page.tsx`). */
const fetchHomeDocumentCached = unstable_cache(
	async () => client.fetch<HomeDocument | null>(homeQuery),
	["home-document"],
	{
		revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
		tags: ["home"],
	},
);

/**
 * Home singleton — cross-request cached with tag `home`.
 * Call from **`generateMetadata`** and the page: one Sanity request per request (React `cache` dedupe).
 */
export const cachedHomeDocument = cache(async () => {
	const data = await fetchHomeDocumentCached();
	return { data };
});
