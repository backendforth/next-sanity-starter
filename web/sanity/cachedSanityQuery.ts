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
	projectSlugsQuery,
	siteLanguageSettingsQuery,
	sitemapPagesQuery,
} from "./queries";
import type {
	PageSlugsQueryResult,
	ProjectSlugsQueryResult,
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
	home: "home",
	work: "work",
	pages: "pages",
	projects: "projects",
	pageSlug: (slug: string) => `page-${slug}`,
	projectSlug: (slug: string) => `project-${slug}`,
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

type SitemapRow = SitemapPagesQueryResult[number];

const fetchSitemapPagesCached = unstable_cache(
	async () => client.fetch<SitemapRow[]>(sitemapPagesQuery),
	["sitemap-pages"],
	{
		revalidate: 3600,
		tags: [
			SANITY_CACHE_TAGS.sitemap,
			SANITY_CACHE_TAGS.pages,
			SANITY_CACHE_TAGS.projects,
			SANITY_CACHE_TAGS.home,
			SANITY_CACHE_TAGS.work,
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

const fetchProjectSlugsCached = unstable_cache(
	async () => client.fetch<ProjectSlugsQueryResult | null>(projectSlugsQuery),
	["project-slugs"],
	{
		revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
		tags: [SANITY_CACHE_TAGS.projects],
	},
);

export const cachedProjectSlugs = cache(
	async (): Promise<ProjectSlugsQueryResult> => {
		if (!isSanityConfigured) return [];
		return (await fetchProjectSlugsCached()) ?? [];
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
