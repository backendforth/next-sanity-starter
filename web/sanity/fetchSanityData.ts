import { cache } from "react";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { cachedSiteLanguageSettingsPublished } from "./cachedSanityQuery";
import { client, isSanityConfigured } from "./client";
import { sanityFetch } from "./live";
import { normalizeSiteLocaleConfig } from "./normalizeSiteLocaleConfig";
import {
	errorSettingsQuery,
	homeQuery,
	pageBySlugQuery,
	projectBySlugQuery,
	siteCookieBannerLayoutQuery,
	siteLanguageSettingsQuery,
	siteNavMenusQuery,
	siteSettingsFaviconQuery,
	siteSettingsSeoFallbackQuery,
	siteSettingsTitleQuery,
	workQuery,
} from "./queries";
import type { SiteSettingsTitleQueryResult } from "./sanity.types.gen";
import type { ErrorSettingsDocument } from "./types/errorSettings";
import type { SiteNavMenusDocument } from "./types/nav";
import type {
	HomeDocument,
	PageDocument,
	PageSeo,
	ProjectDocument,
	WorkDocument,
} from "./types/pages";
import type { SiteCookieBannerDocument } from "./types/siteCookieBanner";
import type { SiteLanguageSettingsDocument } from "./types/siteLanguageSettings";

export type {
	HomeDocument,
	PageDocument,
	PageSeo,
	ProjectDocument,
	WorkDocument,
};

type LiveFetchOptions = {
	stega?: boolean;
	perspective?: "published" | "drafts";
};

/** Dedupes home fetches; pass `{ stega: false }` in `generateMetadata`. */
export const fetchHomeDocument = cache(async (options?: LiveFetchOptions) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: homeQuery,
		...options,
	});
	return data as HomeDocument | null;
});

/** Dedupes page fetches; pass `{ stega: false }` in `generateMetadata`. */
export const fetchPageBySlug = cache(
	async (slug: string, options?: LiveFetchOptions) => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: pageBySlugQuery,
			params: { slug },
			...options,
		});
		return data as PageDocument | null;
	},
);

/** Work singleton — document id `work`. */
export const fetchWorkDocument = cache(async (options?: LiveFetchOptions) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: workQuery,
		...options,
	});
	return data as WorkDocument | null;
});

/** Dedupes project fetches; pass `{ stega: false }` in `generateMetadata`. */
export const fetchProjectBySlug = cache(
	async (slug: string, options?: LiveFetchOptions) => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: projectBySlugQuery,
			params: { slug },
			...options,
		});
		return data as ProjectDocument | null;
	},
);

/**
 * `siteSettings.title` — brand string for `<title>` template (`%s | …`) and Open Graph `siteName`.
 * Falls back to `"Site"` when Sanity is off or the document/title is missing.
 */
export const fetchSiteSettingsTitle = cache(
	async (options?: LiveFetchOptions): Promise<string> => {
		if (!isSanityConfigured) return "Site";
		const { data } = await sanityFetch({
			query: siteSettingsTitleQuery,
			...options,
		});
		const row = data as SiteSettingsTitleQueryResult;
		const t = typeof row?.title === "string" ? row.title.trim() : "";
		return t || "Site";
	},
);

/**
 * `siteSettings.seo` projection for route metadata fallbacks — fetched once per request
 * (React `cache`) instead of joining on every home/page GROQ query.
 */
export const fetchSettingsSeoFallback = cache(
	async (options?: LiveFetchOptions): Promise<PageSeo> => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: siteSettingsSeoFallbackQuery,
			...options,
		});
		return data as PageSeo;
	},
);

/**
 * `siteSettings.favicon` URL for root metadata icons.
 * Returns `null` when unset — the static `app/favicon.ico` then applies.
 */
export const fetchSiteSettingsFavicon = cache(
	async (options?: LiveFetchOptions): Promise<string | null> => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: siteSettingsFaviconQuery,
			...options,
		});
		const row = data as { faviconUrl?: string | null } | null;
		const url =
			typeof row?.faviconUrl === "string" ? row.faviconUrl.trim() : "";
		return url || null;
	},
);

/** `siteNav` main/footer menus with resolved links; no embedded modules. */
export const fetchSiteNavMenus = cache(async () => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: siteNavMenusQuery,
	});
	return data as SiteNavMenusDocument | null;
});

/** Cookie banner copy for the app shell — no embedded modules. */
export const fetchSiteCookieBanner = cache(
	async (
		options?: LiveFetchOptions,
	): Promise<SiteCookieBannerDocument | null> => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: siteCookieBannerLayoutQuery,
			...options,
		});
		return data as SiteCookieBannerDocument | null;
	},
);

function draftClientForSiteLanguageSettings(token: string) {
	return client.withConfig({
		token,
		useCdn: false,
		perspective: "drafts",
	});
}

/**
 * Document id: `siteLanguageSettings` — locales, default, labels for routing + i18n resolution.
 *
 * Uses `client.fetch` (not `sanityFetch`) so `generateStaticParams` can run at build time
 * without `draftMode()`. The published path is wrapped in `unstable_cache` (tag
 * `site-language-settings`) so cross-request reads are deduped — Sanity webhooks for
 * `siteLanguageSettings` invalidate the tag through `/api/revalidate`.
 *
 * With `SANITY_API_READ_TOKEN`, uses **drafts** perspective so unpublished language changes
 * show in dev. Token-mode skips `unstable_cache` (drafts must always be fresh).
 */
export const fetchSiteLanguageSettings = cache(
	async (_options?: LiveFetchOptions): Promise<SiteLocaleConfig> => {
		if (!isSanityConfigured) return cachedSiteLanguageSettingsPublished();
		const token = process.env.SANITY_API_READ_TOKEN?.trim();
		if (!token) {
			return cachedSiteLanguageSettingsPublished();
		}
		const data = await draftClientForSiteLanguageSettings(
			token,
		).fetch<SiteLanguageSettingsDocument | null>(siteLanguageSettingsQuery);
		return normalizeSiteLocaleConfig(data);
	},
);

/** Document id: `errorSettings` — 404 / 500 copy from Studio. */
export const fetchErrorSettings = cache(async (options?: LiveFetchOptions) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: errorSettingsQuery,
		...options,
	});
	return data as ErrorSettingsDocument | null;
});
