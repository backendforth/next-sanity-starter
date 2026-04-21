import { cache } from "react";

import { sanityFetch } from "./live";
import {
	errorSettingsQuery,
	homeQuery,
	pageBySlugQuery,
	siteNavMenusQuery,
} from "./queries";
import type { ErrorSettingsDocument } from "./types/errorSettings";
import type { SiteNavMenusDocument } from "./types/nav";
import type { HomeDocument, PageDocument, PageSeo } from "./types/pages";

export type { HomeDocument, PageDocument, PageSeo };

type LiveFetchOptions = {
	stega?: boolean;
	perspective?: "published" | "drafts" | "previewDrafts";
};

/** Dedupes home fetches; pass `{ stega: false }` in `generateMetadata`. */
export const fetchHomeDocument = cache(async (options?: LiveFetchOptions) => {
	const { data } = await sanityFetch({
		query: homeQuery,
		...options,
	});
	return data as HomeDocument | null;
});

/** Dedupes page fetches; pass `{ stega: false }` in `generateMetadata`. */
export const fetchPageBySlug = cache(
	async (slug: string, options?: LiveFetchOptions) => {
		const { data } = await sanityFetch({
			query: pageBySlugQuery,
			params: { slug },
			...options,
		});
		return data as PageDocument | null;
	},
);

/** `siteNav` main/footer menus with resolved links; no embedded modules. */
export const fetchSiteNavMenus = cache(async () => {
	const { data } = await sanityFetch({
		query: siteNavMenusQuery,
	});
	return data as SiteNavMenusDocument | null;
});

/** Document id: `errorSettings` — 404 / 500 copy from Studio. */
export const fetchErrorSettings = cache(async (options?: LiveFetchOptions) => {
	const { data } = await sanityFetch({
		query: errorSettingsQuery,
		...options,
	});
	return data as ErrorSettingsDocument | null;
});
