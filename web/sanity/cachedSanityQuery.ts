import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
	FALLBACK_SITE_LOCALE_CONFIG,
	type SiteLocaleConfig,
} from "@/src/i18n/fallbackSiteLocales";
import { client, isSanityConfigured } from "./client";
import { SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS } from "./documentCacheRevalidateSeconds";
import { normalizeSiteLocaleConfig } from "./normalizeSiteLocaleConfig";
import {
	homeQuery,
	pageBySlugQuery,
	pageSlugsQuery,
	siteLanguageSettingsQuery,
	sitemapPagesQuery,
} from "./queries";
import type {
	PageSlugsQueryResult,
	SitemapPagesQueryResult,
} from "./sanity.types.gen";
import type { HomeDocument, PageDocument } from "./types/pages";
import type { SiteLanguageSettingsDocument } from "./types/siteLanguageSettings";

export { SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS } from "./documentCacheRevalidateSeconds";

/**
 * Published-only reads via `client.fetch` + `unstable_cache`. See `web/sanity/README.md`
 * (*Layout*) for when to use this vs the `fetchSanityData.ts` wrappers (Draft Mode /
 * Presentation paths).
 *
 * Parameterised queries need their own wrapper (e.g. `cachedPageDocumentBySlug`) with
 * primitive args — object params break React `cache()` deduplication.
 */
export const cachedSanityQuery = cache(async <T>(query: string) => {
	if (!isSanityConfigured) return { data: null as T | null };
	const data = await client.fetch<T>(query);
	return { data };
});

// ── Tag constants (kept in sync with `/api/revalidate`) ─────────────────────

export const SANITY_CACHE_TAGS = {
	home: (locale: string) => `home-${locale}`,
	pages: "pages",
	pageSlug: (slug: string, locale: string) => `page-${slug}-${locale}`,
	sitemap: "site-pages",
	siteLanguageSettings: "site-language-settings",
} as const;

// ── Page-by-slug ────────────────────────────────────────────────────────────

/**
 * `pageBySlugQuery` with `$slug` and `$locale` — one fetch per slug+locale per request.
 *
 * Combines React `cache()` (per-request) with `unstable_cache` (cross-request).
 * Revalidates via tag `page-{slug}-{locale}` or time-based after
 * `SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS`.
 */
export const cachedPageDocumentBySlug = cache(
	async (slug: string, locale: string) => {
		if (!isSanityConfigured) return { data: null as PageDocument | null };
		const tag = SANITY_CACHE_TAGS.pageSlug(slug, locale);
		const fetchPage = unstable_cache(
			async () =>
				client.fetch<PageDocument | null>(pageBySlugQuery, {
					slug,
					locale,
				}),
			[tag],
			{
				revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
				tags: [tag, SANITY_CACHE_TAGS.pages],
			},
		);
		const data = await fetchPage();
		return { data };
	},
);

// ── Home singleton (per language) ──────────────────────────────────────────

/**
 * Home singleton — one document per language. Cross-request cached with tag
 * `home-{locale}`. React `cache` dedupes within a request when `generateMetadata`
 * and the page component both request the same locale.
 */
export const cachedHomeDocument = cache(async (locale: string) => {
	if (!isSanityConfigured) return { data: null as HomeDocument | null };
	const tag = SANITY_CACHE_TAGS.home(locale);
	const fetchHome = unstable_cache(
		async () => client.fetch<HomeDocument | null>(homeQuery, { locale }),
		[tag],
		{
			revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
			tags: [tag],
		},
	);
	const data = await fetchHome();
	return { data };
});

// ── Sitemap snapshot ────────────────────────────────────────────────────────

type SitemapRow = SitemapPagesQueryResult[number];

const fetchSitemapPagesCached = unstable_cache(
	async () => client.fetch<SitemapRow[]>(sitemapPagesQuery),
	["sitemap-pages"],
	{
		revalidate: 3600,
		tags: [SANITY_CACHE_TAGS.sitemap, SANITY_CACHE_TAGS.pages],
	},
);

export type CachedSitemapRow = SitemapRow;

export const cachedSitemapPages = cache(async (): Promise<SitemapRow[]> => {
	if (!isSanityConfigured) return [];
	return fetchSitemapPagesCached();
});

// ── `generateStaticParams` slug list (all languages) ───────────────────────

const fetchPageSlugsCached = unstable_cache(
	async () => client.fetch<PageSlugsQueryResult | null>(pageSlugsQuery),
	["page-slugs"],
	{
		revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
		tags: [SANITY_CACHE_TAGS.pages],
	},
);

export const cachedPageSlugs = cache(
	async (): Promise<PageSlugsQueryResult> => {
		if (!isSanityConfigured) return [];
		return (await fetchPageSlugsCached()) ?? [];
	},
);

// ── Site language settings (no-token path only) ─────────────────────────────
//
// When `SANITY_API_READ_TOKEN` is set, draft state must be honored — that path
// stays in `fetchSanityData.ts` and is not cached cross-request.
const fetchSiteLanguageSettingsPublishedCached = unstable_cache(
	async (): Promise<SiteLocaleConfig> => {
		const data = await client.fetch<SiteLanguageSettingsDocument | null>(
			siteLanguageSettingsQuery,
		);
		return normalizeSiteLocaleConfig(data);
	},
	["site-language-settings"],
	{
		revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
		tags: [SANITY_CACHE_TAGS.siteLanguageSettings],
	},
);

export const cachedSiteLanguageSettingsPublished = cache(
	async (): Promise<SiteLocaleConfig> => {
		if (!isSanityConfigured) return FALLBACK_SITE_LOCALE_CONFIG;
		return fetchSiteLanguageSettingsPublishedCached();
	},
);
