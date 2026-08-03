import { draftMode } from "next/headers";
import { cache } from "react";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import {
	cachedSiteLanguageSettingsPublished,
	SANITY_CACHE_TAGS,
} from "./cachedSanityQuery";
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

/*
 * Every `sanityFetch` below passes the matching `SANITY_CACHE_TAGS` entry.
 * next-sanity stores the result in Next's data cache with `revalidate: false`
 * and only its own `sanity:*` sync tags — which nothing but a mounted
 * `<SanityLive />` ever revalidates. Adding our webhook tags means
 * `/api/revalidate` invalidates these entries too, so published content stays
 * fresh without streaming live events to every anonymous visitor
 * (see `shouldMountSanityLive` in `app/layout.tsx`).
 */

/** Dedupes home fetches; pass `{ stega: false }` in `generateMetadata`. */
export const fetchHomeDocument = cache(
	async (locale: string, options?: LiveFetchOptions) => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: homeQuery,
			tags: [SANITY_CACHE_TAGS.home(locale)],
			params: { locale },
			...options,
		});
		return data as HomeDocument | null;
	},
);

/** Dedupes page fetches; pass `{ stega: false }` in `generateMetadata`. */
export const fetchPageBySlug = cache(
	async (slug: string, locale: string, options?: LiveFetchOptions) => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: pageBySlugQuery,
			params: { slug, locale },
			tags: [SANITY_CACHE_TAGS.pages, SANITY_CACHE_TAGS.pageSlug(slug, locale)],
			...options,
		});
		return data as PageDocument | null;
	},
);

/** `work` landing — one doc per locale (doc-level i18n). */
export const fetchWorkDocument = cache(
	async (locale: string, options?: LiveFetchOptions) => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: workQuery,
			tags: [SANITY_CACHE_TAGS.work(locale)],
			params: { locale },
			...options,
		});
		return data as WorkDocument | null;
	},
);

/** Project detail by slug — one doc per locale. */
export const fetchProjectBySlug = cache(
	async (slug: string, locale: string, options?: LiveFetchOptions) => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: projectBySlugQuery,
			params: { slug, locale },
			tags: [
				SANITY_CACHE_TAGS.projects,
				SANITY_CACHE_TAGS.projectSlug(slug, locale),
			],
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
	async (locale: string, options?: LiveFetchOptions): Promise<string> => {
		if (!isSanityConfigured) return "Site";
		const { data } = await sanityFetch({
			query: siteSettingsTitleQuery,
			params: { locale },
			tags: [SANITY_CACHE_TAGS.siteSettings],
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
	async (locale: string, options?: LiveFetchOptions): Promise<PageSeo> => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: siteSettingsSeoFallbackQuery,
			params: { locale },
			tags: [SANITY_CACHE_TAGS.siteSettings],
			...options,
		});
		return data as PageSeo;
	},
);

/**
 * `siteSettings.favicon` URL for root metadata icons (per-locale document).
 * Returns `null` when unset — the static `app/favicon.ico` then applies.
 */
export const fetchSiteSettingsFavicon = cache(
	async (
		locale: string,
		options?: LiveFetchOptions,
	): Promise<string | null> => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: siteSettingsFaviconQuery,
			params: { locale },
			tags: [SANITY_CACHE_TAGS.siteSettings],
			...options,
		});
		const row = data as { faviconUrl?: string | null } | null;
		const url =
			typeof row?.faviconUrl === "string" ? row.faviconUrl.trim() : "";
		return url || null;
	},
);

/** `siteNav` main/footer menus with resolved links; no embedded modules. */
export const fetchSiteNavMenus = cache(async (locale: string) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: siteNavMenusQuery,
		params: { locale },
		tags: [SANITY_CACHE_TAGS.siteNav],
	});
	return data as SiteNavMenusDocument | null;
});

/** Cookie banner copy for the app shell — no embedded modules. */
export const fetchSiteCookieBanner = cache(
	async (
		locale: string,
		options?: LiveFetchOptions,
	): Promise<SiteCookieBannerDocument | null> => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: siteCookieBannerLayoutQuery,
			params: { locale },
			tags: [SANITY_CACHE_TAGS.siteCookieBanner],
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
 * Document id: `siteLanguageSettings` — the global locale registry. Drives routing
 * (default + available locales) and is NOT itself per-language.
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
		const data = await draftClientForSiteLanguageSettings(
			token,
		).fetch<SiteLanguageSettingsDocument | null>(siteLanguageSettingsQuery);
		return normalizeSiteLocaleConfig(data);
	},
);

/** Document type: `errorSettings` — 404 / 500 copy from Studio (one per language). */
export const fetchErrorSettings = cache(
	async (locale: string, options?: LiveFetchOptions) => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: errorSettingsQuery,
			tags: [SANITY_CACHE_TAGS.errorSettings],
			params: { locale },
			...options,
		});
		return data as ErrorSettingsDocument | null;
	},
);
