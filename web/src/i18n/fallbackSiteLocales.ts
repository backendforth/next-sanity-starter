/**
 * Used when `siteLanguageSettings` is missing or invalid (and for minimal static fallbacks).
 *
 * **Keep in sync** with `FALLBACK_LANGUAGES` in
 * `studio/config/sync/supportedLanguages.ts` — same minimal list so the Studio's document
 * languages and Next routing behave identically before the singleton exists or when it is invalid.
 * Canonical languages live in Sanity (`siteLanguageSettings` + schema `initialValue`).
 */
export type SiteLocaleConfig = {
	/** URL segment ids, in Site languages order. */
	localeIds: readonly string[];
	defaultLocale: string;
	languages: readonly { id: string; title: string }[];
};

/** Minimal single-locale fallback — not a product default; prefer editing Site languages in Studio. */
export const FALLBACK_SITE_LOCALE_CONFIG = {
	localeIds: ["en"],
	defaultLocale: "en",
	languages: [{ id: "en", title: "English" }],
} as const satisfies SiteLocaleConfig;
