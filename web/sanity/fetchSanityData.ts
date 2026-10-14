import { draftMode } from "next/headers";
import { cache } from "react";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { cachedSiteLanguageSettingsPublished } from "./cachedSanityQuery";
import { EMBEDDED_CONTENT_TAGS, SANITY_CACHE_TAGS } from "./cacheTags";
import { client, isSanityConfigured } from "./client";
import { sanityFetch } from "./live";
import { normalizeSiteLocaleConfig } from "./normalizeSiteLocaleConfig";
import {
	errorSettingsQuery,
	homeQuery,
	pageBySlugQuery,
	projectBySlugQuery,
	siteAnalyticsSettingsQuery,
	siteChromeQuery,
	siteLanguageSettingsQuery,
	siteSettingsFaviconQuery,
	siteSettingsSeoFallbackQuery,
	siteSettingsTitleQuery,
	workQuery,
} from "./queries";
import type { PageSeo, SiteFavicon } from "./types";

type LiveFetchOptions = {
	stega?: boolean;
	perspective?: "published" | "drafts";
};

/*
 * Every `sanityFetch` below passes the matching `SANITY_CACHE_TAGS` entry.
 * next-sanity stores the result in Next's data cache with `revalidate: false`
 * and only its own `sanity:*` sync tags — which nothing but a mounted
 * `<SanityLive />` ever revalidates. Adding our webhook tags means
 * `/api/revalidate` invalidates these entries too, so published content stays
 * fresh without streaming live events to every anonymous visitor
 * (see `shouldMountSanityLive` in `src/components/layout/DocumentShell.tsx`).
 */

/** Dedupes home fetches; pass `{ stega: false }` in `generateMetadata`. */
export const fetchHomeDocument = cache(async (options?: LiveFetchOptions) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: homeQuery,
		tags: [SANITY_CACHE_TAGS.home, ...EMBEDDED_CONTENT_TAGS],
		...options,
	});
	return data;
});

/** Dedupes page fetches; pass `{ stega: false }` in `generateMetadata`. */
export const fetchPageBySlug = cache(
	async (slug: string, options?: LiveFetchOptions) => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: pageBySlugQuery,
			params: { slug },
			tags: [SANITY_CACHE_TAGS.pageSlug(slug), ...EMBEDDED_CONTENT_TAGS],
			...options,
		});
		return data;
	},
);

/** Work singleton — document id `work`. */
export const fetchWorkDocument = cache(async (options?: LiveFetchOptions) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: workQuery,
		tags: [SANITY_CACHE_TAGS.work, ...EMBEDDED_CONTENT_TAGS],
		...options,
	});
	return data;
});

/** Dedupes project fetches; pass `{ stega: false }` in `generateMetadata`. */
export const fetchProjectBySlug = cache(
	async (slug: string, options?: LiveFetchOptions) => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: projectBySlugQuery,
			params: { slug },
			tags: [SANITY_CACHE_TAGS.projectSlug(slug), ...EMBEDDED_CONTENT_TAGS],
			...options,
		});
		return data;
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
			tags: [SANITY_CACHE_TAGS.siteSettings],
			...options,
		});
		return data?.title?.trim() || "Site";
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
			tags: [SANITY_CACHE_TAGS.siteSettings],
			...options,
		});
		return data;
	},
);

/**
 * `siteSettings.favicon` for root metadata icons. The image field travels whole
 * (crop + hotspot); `siteFaviconIcons` derives the sizes on the Sanity CDN.
 * Returns `null` when unset — there is no static fallback icon (see
 * `documentMetadata` in `src/components/layout/DocumentShell.tsx`).
 */
export const fetchSiteSettingsFavicon = cache(
	async (options?: LiveFetchOptions): Promise<SiteFavicon | null> => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: siteSettingsFaviconQuery,
			tags: [SANITY_CACHE_TAGS.siteSettings],
			...options,
		});
		return data?.favicon ?? null;
	},
);

/**
 * App-shell chrome (nav, cookie banner, site title) in one `sanityFetch` instead of three —
 * each fetch is two roundtrips (sync-tags probe + data). `fetchSiteSettingsTitle` stays for
 * the `generateMetadata` paths, which fetch with `stega: false`.
 */
export const fetchSiteChrome = cache(async (options?: LiveFetchOptions) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: siteChromeQuery,
		/* `pages`: nav links resolve page slugs. */
		tags: [
			SANITY_CACHE_TAGS.siteNav,
			SANITY_CACHE_TAGS.siteCookieBanner,
			SANITY_CACHE_TAGS.siteSettings,
			SANITY_CACHE_TAGS.pages,
		],
		...options,
	});
	return data;
});

/** Analytics & tracking providers — document id `siteAnalyticsSettings`. */
export const fetchSiteAnalyticsSettings = cache(
	async (options?: Omit<LiveFetchOptions, "stega">) => {
		if (!isSanityConfigured) return null;
		/* Literal `stega: false` keeps the clean types: tracker ids go to third-party scripts. */
		const { data } = await sanityFetch({
			query: siteAnalyticsSettingsQuery,
			tags: [SANITY_CACHE_TAGS.siteAnalyticsSettings],
			...options,
			stega: false,
		});
		return data;
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
 * `draftMode()` throws outside a request scope (`generateStaticParams`, build-time
 * prerender collection) — treat that as "not in draft mode".
 */
async function isDraftModeEnabled(): Promise<boolean> {
	try {
		return (await draftMode()).isEnabled;
	} catch {
		return false;
	}
}

/**
 * Document id: `siteLanguageSettings` — locales, default, labels for routing + i18n resolution.
 *
 * Uses `client.fetch` (not `sanityFetch`) so `generateStaticParams` can run at build time.
 * The published path is wrapped in `unstable_cache` (tag `site-language-settings`) so
 * cross-request reads are deduped — Sanity webhooks for `siteLanguageSettings` invalidate
 * the tag through `/api/revalidate`.
 *
 * The **drafts** perspective (uncached, no CDN) is reserved for renders that actually need
 * it: dev, and Draft Mode / Presentation requests. A production deploy sets
 * `SANITY_API_READ_TOKEN` for Visual Editing, and gating on the token alone made every
 * visitor-facing render pay an uncached Sanity API round trip before anything else.
 */
export const fetchSiteLanguageSettings = cache(
	async (_options?: LiveFetchOptions): Promise<SiteLocaleConfig> => {
		if (!isSanityConfigured) return cachedSiteLanguageSettingsPublished();
		const token = process.env.SANITY_API_READ_TOKEN?.trim();
		if (!token) {
			return cachedSiteLanguageSettingsPublished();
		}
		const useDrafts =
			process.env.NODE_ENV === "development" || (await isDraftModeEnabled());
		if (!useDrafts) {
			return cachedSiteLanguageSettingsPublished();
		}
		const data = await draftClientForSiteLanguageSettings(token).fetch(
			siteLanguageSettingsQuery,
		);
		return normalizeSiteLocaleConfig(data);
	},
);

/** Document id: `errorSettings` — 404 / 500 copy from Studio. */
export const fetchErrorSettings = cache(async (options?: LiveFetchOptions) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: errorSettingsQuery,
		/* `pages`: the 404 body's links resolve page slugs. */
		tags: [SANITY_CACHE_TAGS.errorSettings, SANITY_CACHE_TAGS.pages],
		...options,
	});
	return data;
});
