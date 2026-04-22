/**
 * Used when `siteLanguageSettings` is missing or invalid (and for minimal static fallbacks).
 */
export type SiteLocaleConfig = {
	/** URL segment ids, in fallback order for translated Sanity fields. */
	localeIds: readonly string[];
	defaultLocale: string;
	languages: readonly { id: string; title: string }[];
};

export const FALLBACK_SITE_LOCALE_CONFIG = {
	localeIds: ["en", "de"],
	defaultLocale: "en",
	languages: [
		{ id: "en", title: "English" },
		{ id: "de", title: "Deutsch" },
	],
} as const satisfies SiteLocaleConfig;
