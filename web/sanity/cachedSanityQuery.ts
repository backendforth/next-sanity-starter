/**
 * Published-only reads via `client.fetch` + `unstable_cache`, for paths without a request
 * scope or Draft Mode: the sitemap, `generateStaticParams` slug lists and the published
 * language settings. Everything that renders content goes through `fetchSanityData.ts`.
 */

import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
	FALLBACK_SITE_LOCALE_CONFIG,
	type SiteLocaleConfig,
} from "@/src/i18n/fallbackSiteLocales";
import { SANITY_CACHE_TAGS } from "./cacheTags";
import { client, isSanityConfigured } from "./client";
import { normalizeSiteLocaleConfig } from "./normalizeSiteLocaleConfig";
import {
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

/**
 * How long these published reads stay cached. With the revalidate webhook configured
 * (`SANITY_REVALIDATE_SECRET`) they live until `/api/revalidate` expires their tags; without it
 * they fall back to 60 s. Only these reads: `sanityFetch` content is cached without a time limit
 * and refreshes through its tags alone (see `web/README.md`, Freshness).
 */
const SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS: number | false =
	process.env.SANITY_REVALIDATE_SECRET?.trim() ? false : 60;

// ── Sitemap snapshot ────────────────────────────────────────────────────────

type SitemapRow = SitemapPagesQueryResult[number];

const fetchSitemapPagesCached = unstable_cache(
	async () => client.fetch(sitemapPagesQuery),
	["sitemap-pages"],
	{
		revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
		/* Every routable type's webhook entry purges `sitemap`. */
		tags: [SANITY_CACHE_TAGS.sitemap],
	},
);

export const cachedSitemapPages = cache(async (): Promise<SitemapRow[]> => {
	if (!isSanityConfigured) return [];
	return fetchSitemapPagesCached();
});

// ── `generateStaticParams` slug list ────────────────────────────────────────

const fetchPageSlugsCached = unstable_cache(
	async () => client.fetch(pageSlugsQuery),
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
	async () => client.fetch(projectSlugsQuery),
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
		const data = await client.fetch(siteLanguageSettingsQuery);
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
