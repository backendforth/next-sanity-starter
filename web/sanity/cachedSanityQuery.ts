import { cache } from "react";

import { client } from "./client";
import { homeQuery, pageBySlugQuery } from "./queries";
import type { HomeDocument, PageDocument } from "./types/pages";

/**
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
 */
export const cachedPageDocumentBySlug = cache(async (slug: string) => {
	const data = await client.fetch<PageDocument | null>(pageBySlugQuery, {
		slug,
	});
	return { data };
});

/**
 * Home singleton — same cache as `cachedSanityQuery(homeQuery)`.
 * Call from **`generateMetadata`** and the page: one Sanity request per request (React `cache` dedupe).
 */
export function cachedHomeDocument() {
	return cachedSanityQuery<HomeDocument | null>(homeQuery);
}
