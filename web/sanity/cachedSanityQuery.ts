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
import type { HomeDocument, PageDocument } from "./types/pages";
import type { SiteLanguageSettingsDocument } from "./types/siteLanguageSettings";

export { SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS } from "./documentCacheRevalidateSeconds";

/**
 * **Published-only** reads via `client.fetch` + `unstable_cache` (tag- + time-based revalidation).
 *
 * App routes that need **Presentation / Draft Mode / Visual Editing** must use
 * `fetchHomeDocument` / `fetchPageBySlug` from `fetchSanityData.ts` instead — those wrap
 * `sanityFetch` from `defineLive`, which is required for stega + live previews.
 *
 * Use this module from places that **never** need draft state:
 * - `app/sitemap.ts`           — sitemap snapshot, refreshed via `pages` / `home` tags.
 * - `generateStaticParams`     — slug lists for ISR pre-rendering.
 * - `proxy.ts` / no-token reads of `siteLanguageSettings` (cross-request cache).
 *
 * Static GROQ (no `$params`) is deduped within a request when the same `query` string
 * is reused (e.g. `generateMetadata` + page component). For parameterised queries, use
 * a dedicated wrapper like `cachedPageDocumentBySlug` so arguments stay primitives —
 * object params break React `cache` deduplication.
 */
export const cachedSanityQuery = cache(async <T>(query: string) => {
	if (!isSanityConfigured) return { data: null as T | null };
	const data = await client.fetch<T>(query);
	return { data };
});

// ── Tag constants (kept in sync with `/api/revalidate`) ─────────────────────

export const SANITY_CACHE_TAGS = {
	home: "home",
	pages: "pages",
	pageSlug: (slug: string) => `page-${slug}`,
	sitemap: "site-pages",
	siteLanguageSettings: "site-language-settings",
} as const;

// ── Page-by-slug ────────────────────────────────────────────────────────────

/**
 * `pageBySlugQuery` with `$slug` — one fetch per slug per request.
 *
 * Combines React `cache()` (per-request) with `unstable_cache` (cross-request).
 * Revalidates via tag `page-{slug}` or time-based after `SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS`.
 */
export const cachedPageDocumentBySlug = cache(async (slug: string) => {
	if (!isSanityConfigured) return { data: null as PageDocument | null };
	const fetchPage = unstable_cache(
		async () =>
			client.fetch<PageDocument | null>(pageBySlugQuery, {
				slug,
			}),
		[`page-${slug}`],
		{
			revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
			tags: [`page-${slug}`, SANITY_CACHE_TAGS.pages],
		},
	);
	const data = await fetchPage();
	return { data };
});

// ── Home singleton ──────────────────────────────────────────────────────────

const fetchHomeDocumentCached = unstable_cache(
	async () => client.fetch<HomeDocument | null>(homeQuery),
	["home-document"],
	{
		revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
		tags: [SANITY_CACHE_TAGS.home],
	},
);

/**
 * Home singleton — cross-request cached with tag `home`.
 * Call from `generateMetadata` and the page: one Sanity request per request (React `cache` dedupe).
 */
export const cachedHomeDocument = cache(async () => {
	if (!isSanityConfigured) return { data: null as HomeDocument | null };
	const data = await fetchHomeDocumentCached();
	return { data };
});

// ── Sitemap snapshot ────────────────────────────────────────────────────────

type SitemapRow = {
	_id: string;
	_type: string;
	_updatedAt: string;
	slug: string | null;
	path: string;
};

const fetchSitemapPagesCached = unstable_cache(
	async () => client.fetch<SitemapRow[]>(sitemapPagesQuery),
	["sitemap-pages"],
	{
		revalidate: 3600,
		tags: [
			SANITY_CACHE_TAGS.sitemap,
			SANITY_CACHE_TAGS.pages,
			SANITY_CACHE_TAGS.home,
		],
	},
);

export type CachedSitemapRow = SitemapRow;

export const cachedSitemapPages = cache(async (): Promise<SitemapRow[]> => {
	if (!isSanityConfigured) return [];
	return fetchSitemapPagesCached();
});

// ── `generateStaticParams` slug list ────────────────────────────────────────

const fetchPageSlugsCached = unstable_cache(
	async () => client.fetch<{ slug?: string }[] | null>(pageSlugsQuery),
	["page-slugs"],
	{
		revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
		tags: [SANITY_CACHE_TAGS.pages],
	},
);

export const cachedPageSlugs = cache(async () => {
	if (!isSanityConfigured) return [] as { slug?: string }[];
	return (await fetchPageSlugsCached()) ?? [];
});

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
