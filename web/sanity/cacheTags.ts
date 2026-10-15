/**
 * Next cache tags for every Sanity read, and the webhook's document type → tag map. One module
 * so the two halves cannot drift: `fetchSanityData.ts` / `cachedSanityQuery.ts` attach these
 * tags when they fetch, `/api/revalidate` invalidates them when Sanity fires the webhook.
 *
 * `sanityFetch` caches with `revalidate: false`; its own sync tags are only refreshed by a
 * mounted `<SanityLive />`, which anonymous visitors don't get when the webhook is configured.
 * These tags are how published content reaches them.
 */

/** The revalidate webhook's signing secret (`/api/revalidate`); `""` when unset. */
export const revalidateSecret =
	process.env.SANITY_REVALIDATE_SECRET?.trim() ?? "";

/**
 * Whether published content refreshes through the webhook. Without it the published reads
 * expire after 60 s (`cachedSanityQuery.ts`) and every visitor gets `<SanityLive />`
 * (`DocumentShell.tsx`).
 */
export const hasRevalidateWebhook = revalidateSecret !== "";

export const SANITY_CACHE_TAGS = {
	home: "home",
	work: "work",
	pages: "pages",
	projects: "projects",
	sitemap: "site-pages",
	siteLanguageSettings: "site-language-settings",
	siteSettings: "site-settings",
	siteNav: "site-nav",
	siteCookieBanner: "site-cookie-banner",
	siteAnalyticsSettings: "site-analytics-settings",
	errorSettings: "error-settings",
} as const;

/**
 * Carried by every read whose document can show OTHER documents: `module.contentRefs` lists
 * pull title, slug and preview image of pages and projects into the host's cached response, and
 * internal links resolve the target's slug. Editing one project or renaming a page's slug has
 * to purge every entry that may show it, not just its own detail route.
 *
 * The cost is deliberate: any page or project publish invalidates the module-hosting entries
 * (home, work, pages, projects), which re-render on the next request. A per-slug tag would add
 * nothing — every detail read carries its collection tag, which the same publish purges.
 */
export const EMBEDDED_CONTENT_TAGS: readonly string[] = [
	SANITY_CACHE_TAGS.pages,
	SANITY_CACHE_TAGS.projects,
];

/**
 * Webhook document type → tags to invalidate. Also the allow-list: a `_type` missing here is
 * ignored by `/api/revalidate`, so forged payloads cannot force cache churn.
 */
const WEBHOOK_TAG_MAP: Record<string, readonly string[]> = {
	/* Content-refs lists and internal links embed the titles of `home` and `work` as well, so
	 * they purge the embedding entries like a page does. */
	home: [
		SANITY_CACHE_TAGS.home,
		SANITY_CACHE_TAGS.pages,
		SANITY_CACHE_TAGS.sitemap,
	],
	work: [
		SANITY_CACHE_TAGS.work,
		SANITY_CACHE_TAGS.pages,
		SANITY_CACHE_TAGS.sitemap,
	],
	page: [SANITY_CACHE_TAGS.pages, SANITY_CACHE_TAGS.sitemap],
	project: [SANITY_CACHE_TAGS.projects, SANITY_CACHE_TAGS.sitemap],
	/* Category titles render inside project pages and content-refs lists, not on a route of
	 * their own — purge the collection that displays them. */
	projectCategory: [SANITY_CACHE_TAGS.projects],
	siteSettings: [SANITY_CACHE_TAGS.siteSettings],
	siteNav: [SANITY_CACHE_TAGS.siteNav],
	siteCookieBanner: [SANITY_CACHE_TAGS.siteCookieBanner],
	siteAnalyticsSettings: [SANITY_CACHE_TAGS.siteAnalyticsSettings],
	errorSettings: [SANITY_CACHE_TAGS.errorSettings],
	siteLanguageSettings: [SANITY_CACHE_TAGS.siteLanguageSettings],
	/* Linking or unlinking a translation changes every route's sibling list (`translationsQuery`:
	 * hreflang, the language switch) and the sitemap's alternates. */
	"translation.metadata": [
		SANITY_CACHE_TAGS.pages,
		SANITY_CACHE_TAGS.projects,
		SANITY_CACHE_TAGS.home,
		SANITY_CACHE_TAGS.work,
		SANITY_CACHE_TAGS.sitemap,
	],
	/* Asset documents hold fields the queries read (image alt text; Mux poster frame, playback
	 * ID, track size). Every content read carries `pages` or `projects`, the shell included. */
	"sanity.imageAsset": EMBEDDED_CONTENT_TAGS,
	"mux.videoAsset": EMBEDDED_CONTENT_TAGS,
};

/**
 * Tags to invalidate for one webhook payload; empty when the type is not allow-listed (the
 * caller answers `200 { revalidated: false }`).
 */
export function tagsForWebhookDocument(type: string | undefined): string[] {
	/* Own keys only: a forged `_type` like "constructor" must not reach `Object.prototype`. */
	if (!type || !Object.hasOwn(WEBHOOK_TAG_MAP, type)) return [];
	return [...(WEBHOOK_TAG_MAP[type] ?? [])];
}
