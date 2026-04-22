import { cache } from "react";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { client } from "./client";
import { sanityFetch } from "./live";
import { normalizeSiteLocaleConfig } from "./normalizeSiteLocaleConfig";
import {
	errorSettingsQuery,
	homeQuery,
	pageBySlugQuery,
	siteLanguageSettingsQuery,
	siteNavMenusQuery,
} from "./queries";
import type { ErrorSettingsDocument } from "./types/errorSettings";
import type { SiteNavMenusDocument } from "./types/nav";
import type { HomeDocument, PageDocument, PageSeo } from "./types/pages";
import type { SiteLanguageSettingsDocument } from "./types/siteLanguageSettings";

export type { HomeDocument, PageDocument, PageSeo };

type LiveFetchOptions = {
	stega?: boolean;
	perspective?: "published" | "drafts";
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

function clientForSiteLanguageSettings() {
	const token = process.env.SANITY_API_READ_TOKEN?.trim();
	if (!token) {
		return client;
	}
	return client.withConfig({
		token,
		useCdn: false,
		perspective: "drafts",
	});
}

/**
 * Document id: `siteLanguageSettings` — locales, default, labels for routing + i18n resolution.
 * Uses `client.fetch` (not `sanityFetch`) so `generateStaticParams` can run at build time without `draftMode()`.
 * With `SANITY_API_READ_TOKEN`, uses **drafts** perspective so unpublished language changes show in dev.
 */
export const fetchSiteLanguageSettings = cache(
	async (_options?: LiveFetchOptions): Promise<SiteLocaleConfig> => {
		const data =
			await clientForSiteLanguageSettings().fetch<SiteLanguageSettingsDocument | null>(
				siteLanguageSettingsQuery,
			);
		return normalizeSiteLocaleConfig(data);
	},
);

/** Document id: `errorSettings` — 404 / 500 copy from Studio. */
export const fetchErrorSettings = cache(async (options?: LiveFetchOptions) => {
	const { data } = await sanityFetch({
		query: errorSettingsQuery,
		...options,
	});
	return data as ErrorSettingsDocument | null;
});
