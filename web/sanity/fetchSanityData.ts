import "server-only";

import { draftMode } from "next/headers";
import { cache } from "react";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { cachedSiteLanguageSettingsPublished } from "./cachedSanityQuery";
import { EMBEDDED_CONTENT_TAGS, SANITY_CACHE_TAGS } from "./cacheTags";
import { client, isSanityConfigured } from "./client";
import { sanityFetch } from "./live";
import { normalizeSiteLocaleConfig } from "./normalizeSiteLocaleConfig";
import {
	homeQuery,
	pageBySlugQuery,
	projectBySlugQuery,
	siteChromeQuery,
	siteLanguageSettingsQuery,
	workQuery,
} from "./queries";

/*
 * Every `sanityFetch` below passes the matching `SANITY_CACHE_TAGS` entry.
 * next-sanity stores the result in Next's data cache with `revalidate: false`
 * and only its own `sanity:*` sync tags — which nothing but a mounted
 * `<SanityLive />` ever revalidates. Adding our webhook tags means
 * `/api/revalidate` invalidates these entries too, so published content stays
 * fresh without streaming live events to every anonymous visitor
 * (see `shouldMountSanityLive` in `src/components/layout/DocumentShell.tsx`).
 *
 * The fetchers take primitive arguments only (`locale`, `slug`): React `cache` keys on
 * argument identity, so `generateMetadata` and the page share one entry per request. Stega follows Draft Mode
 * (`sanityFetch`'s default); metadata cleans the strings it uses (`stegaClean`), never whole
 * documents.
 */

/** `home` for one language (one document per language). */
export const fetchHomeDocument = cache(async (locale: string) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: homeQuery,
		params: { locale },
		tags: [
			SANITY_CACHE_TAGS.home(locale),
			SANITY_CACHE_TAGS.homeAll,
			...EMBEDDED_CONTENT_TAGS,
		],
	});
	return data;
});

/** A `page` by slug in one language. */
export const fetchPageBySlug = cache(async (slug: string, locale: string) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: pageBySlugQuery,
		params: { slug, locale },
		tags: [SANITY_CACHE_TAGS.pageSlug(slug, locale), ...EMBEDDED_CONTENT_TAGS],
	});
	return data;
});

/** `work` landing for one language. */
export const fetchWorkDocument = cache(async (locale: string) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: workQuery,
		params: { locale },
		tags: [
			SANITY_CACHE_TAGS.work(locale),
			SANITY_CACHE_TAGS.workAll,
			...EMBEDDED_CONTENT_TAGS,
		],
	});
	return data;
});

/** A `project` by slug in one language. */
export const fetchProjectBySlug = cache(
	async (slug: string, locale: string) => {
		if (!isSanityConfigured) return null;
		const { data } = await sanityFetch({
			query: projectBySlugQuery,
			params: { slug, locale },
			tags: [
				SANITY_CACHE_TAGS.projectSlug(slug, locale),
				...EMBEDDED_CONTENT_TAGS,
			],
		});
		return data;
	},
);

/**
 * The app shell of one language (`siteChromeQuery`): nav, cookie banner, site settings,
 * analytics and the 404 copy in one fetch. Read by the layout, every `generateMetadata` and the
 * 404 pages; call it with a validated locale, it is part of the cache key.
 */
export const fetchSiteChrome = cache(async (locale: string) => {
	if (!isSanityConfigured) return null;
	const { data } = await sanityFetch({
		query: siteChromeQuery,
		params: { locale },
		/* `pages`: nav and 404-body links resolve home and page paths (`PAGE_REFERENCES`).
		 * `siteLanguageSettings`: the favicon and banner fallbacks read the default language. */
		tags: [
			SANITY_CACHE_TAGS.siteNav,
			SANITY_CACHE_TAGS.siteCookieBanner,
			SANITY_CACHE_TAGS.siteSettings,
			SANITY_CACHE_TAGS.siteAnalyticsSettings,
			SANITY_CACHE_TAGS.errorSettings,
			SANITY_CACHE_TAGS.siteLanguageSettings,
			SANITY_CACHE_TAGS.pages,
		],
	});
	return data;
});

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
	async (): Promise<SiteLocaleConfig> => {
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
