import { cache } from "react";

import {
	cachedPageDocumentBySlug,
	cachedSanityQuery,
} from "./cachedSanityQuery";
import { client } from "./client";
import { homeQuery, siteNavMenusQuery } from "./queries";
import type { SiteNavMenusDocument } from "./types/nav";
import type { HomeDocument } from "./types/pages";

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

/** `siteNav` main/footer menus with resolved links; no embedded modules. */
export const fetchSiteNavMenus = cache(() =>
	client.fetch<SiteNavMenusDocument | null>(siteNavMenusQuery),
);
