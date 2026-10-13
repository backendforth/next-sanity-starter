/**
 * Next cache tags for every Sanity read, and the webhook's document type → tag map. One module
 * so the two halves cannot drift: `fetchSanityData.ts` / `cachedSanityQuery.ts` attach these
 * tags when they fetch, `/api/revalidate` invalidates them when Sanity fires the webhook.
 *
 * `sanityFetch` caches with `revalidate: false`; its own sync tags are only refreshed by a
 * mounted `<SanityLive />`, which anonymous visitors don't get when the webhook is configured.
 * These tags are how published content reaches them.
 */

export const SANITY_CACHE_TAGS = {
	home: (locale: string) => `home-${locale}`,
	work: (locale: string) => `work-${locale}`,
	/** Every language's home/work entry — each one projects its sibling variants (`translationsQuery`). */
	homeAll: "home-all",
	workAll: "work-all",
	pages: "pages",
	projects: "projects",
	pageSlug: (slug: string, locale: string) => `page-${slug}-${locale}`,
	projectSlug: (slug: string, locale: string) => `project-${slug}-${locale}`,
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
 * (home, work, pages, projects), which re-render on the next request. Per-slug tags stay for
 * the targeted purge of a detail route.
 */
export const EMBEDDED_CONTENT_TAGS: readonly string[] = [
	SANITY_CACHE_TAGS.pages,
	SANITY_CACHE_TAGS.projects,
];

/**
 * Webhook document type → tags to invalidate. Also the allow-list: a `_type` missing here is
 * ignored by `/api/revalidate`, so forged payloads cannot force cache churn.
 *
 * Every route document projects its other-language variants (`translationsQuery`) for hreflang
 * and the language switch, so a publish in one language refreshes its siblings too: `pages` /
 * `projects` already span all languages, home and work purge their `*-all` tags. Per-language
 * tags need the payload's `language`; without it the collection tags still cover the change.
 */
const WEBHOOK_TAG_MAP: Record<
	string,
	(slug?: string, language?: string) => string[]
> = {
	home: (_slug, language) => [
		...(language ? [SANITY_CACHE_TAGS.home(language)] : []),
		SANITY_CACHE_TAGS.homeAll,
		SANITY_CACHE_TAGS.sitemap,
	],
	work: (_slug, language) => [
		...(language ? [SANITY_CACHE_TAGS.work(language)] : []),
		SANITY_CACHE_TAGS.workAll,
		SANITY_CACHE_TAGS.sitemap,
	],
	page: (slug, language) => [
		SANITY_CACHE_TAGS.pages,
		SANITY_CACHE_TAGS.sitemap,
		...(slug && language ? [SANITY_CACHE_TAGS.pageSlug(slug, language)] : []),
	],
	project: (slug, language) => [
		SANITY_CACHE_TAGS.projects,
		SANITY_CACHE_TAGS.sitemap,
		...(slug && language
			? [SANITY_CACHE_TAGS.projectSlug(slug, language)]
			: []),
	],
	/* Category titles render inside project pages and content-refs lists, not on a route of
	 * their own — purge the collection that displays them. */
	projectCategory: () => [SANITY_CACHE_TAGS.projects],
	siteSettings: () => [SANITY_CACHE_TAGS.siteSettings],
	siteNav: () => [SANITY_CACHE_TAGS.siteNav],
	siteCookieBanner: () => [SANITY_CACHE_TAGS.siteCookieBanner],
	siteAnalyticsSettings: () => [SANITY_CACHE_TAGS.siteAnalyticsSettings],
	errorSettings: () => [SANITY_CACHE_TAGS.errorSettings],
	siteLanguageSettings: () => [SANITY_CACHE_TAGS.siteLanguageSettings],
	/* Linking or unlinking translations in Studio only edits this document. */
	"translation.metadata": () => [
		SANITY_CACHE_TAGS.pages,
		SANITY_CACHE_TAGS.projects,
		SANITY_CACHE_TAGS.homeAll,
		SANITY_CACHE_TAGS.workAll,
		SANITY_CACHE_TAGS.sitemap,
	],
};

/** Document types the webhook acts on — use them in the Sanity webhook's filter. */
export const WEBHOOK_DOCUMENT_TYPES = Object.keys(WEBHOOK_TAG_MAP);

/**
 * Tags to invalidate for one webhook payload; empty when the type is not allow-listed (the
 * caller answers `200 { revalidated: false }`). Per-slug and per-language tags are skipped when
 * the payload lacks a slug or language; the collection tags still cover the change.
 */
export function tagsForWebhookDocument(
	type: string | undefined,
	slug: string | undefined,
	language: string | undefined,
): string[] {
	/* Own keys only: a forged `_type` like "constructor" must not reach `Object.prototype`. */
	if (!type || !Object.hasOwn(WEBHOOK_TAG_MAP, type)) return [];
	const resolve = WEBHOOK_TAG_MAP[type];
	return resolve ? [...new Set(resolve(slug, language))] : [];
}
