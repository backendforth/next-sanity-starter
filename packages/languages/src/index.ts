/**
 * Single source of truth for site + Studio languages (committed with Git).
 *
 * Used by:
 * - Next.js (`web`) — URLs, `proxy.ts` (i18n), `sanityLocalizedText` fallback order
 * - Sanity Studio — `sanity-plugin-internationalized-array` (`languages` / `defaultLanguages`)
 *
 * When adding a locale: extend `SITE_LOCALES`, add a `SITE_LOCALE_LABELS` entry, set
 * `SITE_DEFAULT_LOCALE` if the default URL language changes.
 */
export const SITE_LOCALES = ["en", "de"] as const;

export type SiteLocaleCode = (typeof SITE_LOCALES)[number];

/** URL without prefix (`/`, `/about`). Must appear in `SITE_LOCALES`. */
export const SITE_DEFAULT_LOCALE: SiteLocaleCode = "en";

/** Studio UI labels — one per id in `SITE_LOCALES`. */
export const SITE_LOCALE_LABELS = {
	en: "English",
	de: "Deutsch",
} as const satisfies Record<SiteLocaleCode, string>;

/** `internationalizedArray({ languages })` */
export const studioLanguages = SITE_LOCALES.map((id) => ({
	id,
	title: SITE_LOCALE_LABELS[id],
}));

/** `internationalizedArray({ defaultLanguages })` — usually the same as default URL locale. */
export const defaultLanguageIds = [SITE_DEFAULT_LOCALE] as const;
