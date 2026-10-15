/**
 * Published-only reads via `client.fetch` + `unstable_cache`, for paths without a request
 * scope or Draft Mode: the sitemap, `generateStaticParams` slug lists and the published
 * language settings. Everything that renders content goes through `fetchSanityData.ts`.
 */

import { unstable_cache } from "next/cache";
import {
	FALLBACK_SITE_LOCALE_CONFIG,
	type SiteLocaleConfig,
} from "@/src/i18n/fallbackSiteLocales";
import { hasRevalidateWebhook, SANITY_CACHE_TAGS } from "./cacheTags";
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
	hasRevalidateWebhook ? false : 60;

// ── Sitemap snapshot ────────────────────────────────────────────────────────

const fetchSitemapPagesCached = unstable_cache(
	async () => client.fetch(sitemapPagesQuery),
	["sitemap-pages"],
	{
		revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
		/* Every routable type's webhook entry purges `sitemap`. */
		tags: [SANITY_CACHE_TAGS.sitemap],
	},
);

export async function cachedSitemapPages(): Promise<SitemapPagesQueryResult> {
	return isSanityConfigured ? fetchSitemapPagesCached() : [];
}

// ── `generateStaticParams` slug lists (all languages) ──────────────────────

const fetchPageSlugsCached = unstable_cache(
	async () => client.fetch(pageSlugsQuery),
	["page-slugs"],
	{
		revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
		tags: [SANITY_CACHE_TAGS.pages],
	},
);

export async function cachedPageSlugs(): Promise<PageSlugsQueryResult> {
	return isSanityConfigured ? fetchPageSlugsCached() : [];
}

const fetchProjectSlugsCached = unstable_cache(
	async () => client.fetch(projectSlugsQuery),
	["project-slugs"],
	{
		revalidate: SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS,
		tags: [SANITY_CACHE_TAGS.projects],
	},
);

export async function cachedProjectSlugs(): Promise<ProjectSlugsQueryResult> {
	return isSanityConfigured ? fetchProjectSlugsCached() : [];
}

// ── Site language settings, published ───────────────────────────────────────
//
// Every render outside dev and Draft Mode reads this, with a read token or without one;
// `fetchSiteLanguageSettings` (`fetchSanityData.ts`) switches to an uncached drafts read only
// for those two.
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

export async function cachedSiteLanguageSettingsPublished(): Promise<SiteLocaleConfig> {
	return isSanityConfigured
		? fetchSiteLanguageSettingsPublishedCached()
		: FALLBACK_SITE_LOCALE_CONFIG;
}
