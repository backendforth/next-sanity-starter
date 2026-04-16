import { unstable_cache } from "next/cache";
import { cache } from "react";

import {
	cachedPageDocumentBySlug,
	cachedSanityQuery,
} from "./cachedSanityQuery";
import { client } from "./client";
import { errorSettingsQuery, homeQuery, siteNavMenusQuery } from "./queries";
import type { ErrorSettingsDocument } from "./types/errorSettings";
import type { SiteNavMenusDocument } from "./types/nav";
import type { HomeDocument } from "./types/pages";

export type { ErrorSettingsDocument } from "./types/errorSettings";
/** Prefer `import type { … } from "@/sanity/types/pages"` (or `@/sanity/types`) in routes. */
export type { HomeDocument, PageDocument, PageSeo } from "./types/pages";

/** Document body for layouts / pages — uses the same cache as `cachedSanityQuery(homeQuery)`. */
export async function fetchHomeDocument() {
	return (await cachedSanityQuery<HomeDocument | null>(homeQuery)).data;
}

/** Same cache as `cachedPageDocumentBySlug` — prefer that helper if you want `{ data }`. */
export async function fetchPageBySlug(slug: string) {
	return (await cachedPageDocumentBySlug(slug)).data;
}

/**
 * `siteNav` main/footer menus — rendered in RootLayout on every request.
 *
 * Two-layer caching:
 * - `react.cache()` → deduplicates within a single render pass (generateMetadata + layout)
 * - `unstable_cache` → persists across requests; revalidates hourly or on-demand via tag `site-nav`
 *
 * Trigger on-demand revalidation from your webhook handler:
 *   `revalidateTag("site-nav")`
 */
const _fetchSiteNavMenusCached = unstable_cache(
	() => client.fetch<SiteNavMenusDocument | null>(siteNavMenusQuery),
	["site-nav-menus"],
	{ revalidate: 3600, tags: ["site-nav"] },
);

export const fetchSiteNavMenus = cache(_fetchSiteNavMenusCached);

/**
 * Error settings singleton — fetched by 404 / 500 pages.
 *
 * Error pages are rendered infrequently; 1-hour cache + on-demand tag is sufficient.
 * Revalidate via tag `error-settings` from your webhook handler when the document changes.
 */
const _fetchErrorSettingsCached = unstable_cache(
	() => client.fetch<ErrorSettingsDocument | null>(errorSettingsQuery),
	["error-settings"],
	{ revalidate: 3600, tags: ["error-settings"] },
);

export const fetchErrorSettings = cache(_fetchErrorSettingsCached);
