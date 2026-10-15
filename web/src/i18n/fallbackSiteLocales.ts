import { FALLBACK_SITE_LANGUAGES } from "@repo/site-languages";

export type SiteLocaleConfig = {
	/** URL segment ids, in fallback order for translated Sanity fields. */
	localeIds: readonly string[];
	defaultLocale: string;
	languages: readonly { id: string; title: string }[];
};

/**
 * Used when `siteLanguageSettings` is missing or lists no language — the same minimal list the
 * Studio falls back to (`@repo/site-languages`). Not a product default: languages are edited in
 * the Studio (Settings → Site languages).
 */
export const FALLBACK_SITE_LOCALE_CONFIG: SiteLocaleConfig = {
	localeIds: FALLBACK_SITE_LANGUAGES.map((l) => l.id),
	defaultLocale: FALLBACK_SITE_LANGUAGES[0].id,
	languages: FALLBACK_SITE_LANGUAGES,
};
