import { unstable_cache } from "next/cache";
import { cache } from "react";

import { client } from "./client";
import { homeQuery, pageBySlugQuery } from "./queries";
import type { HomeDocument, PageDocument } from "./types/pages";

const REVALIDATE_SECONDS = 60;

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
 * Revalidates via tag `page-{slug}` or time-based after `REVALIDATE_SECONDS`.
 */
export const cachedPageDocumentBySlug = cache(async (slug: string) => {
	const fetchPage = unstable_cache(
		async () =>
			client.fetch<PageDocument | null>(pageBySlugQuery, {
				slug,
			}),
		[`page-${slug}`],
		{ revalidate: REVALIDATE_SECONDS, tags: [`page-${slug}`, "pages"] },
	);
	const data = await fetchPage();
	return { data };
});

/**
 * Home singleton — cross-request cached with tag `home`.
 * Call from **`generateMetadata`** and the page: one Sanity request per request (React `cache` dedupe).
 */
export const cachedHomeDocument = cache(async () => {
	const fetchHome = unstable_cache(
		async () => client.fetch<HomeDocument | null>(homeQuery),
		["home-document"],
		{ revalidate: REVALIDATE_SECONDS, tags: ["home"] },
	);
	const data = await fetchHome();
	return { data };
});
