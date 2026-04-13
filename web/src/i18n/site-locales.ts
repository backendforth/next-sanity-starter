/**
 * Edit this file to change which languages the site supports and which one is the default.
 *
 * - **`SITE_DEFAULT_LOCALE`**: shown at URLs **without** a language prefix (`/` = home in that language).
 * - **`SITE_LOCALES`**: every supported language code. Order matters for **fallback** in Sanity fields
 *   (`sanity/utils/sanityLocalizedText.ts`): if a string has no value for the requested language,
 *   the app tries the other entries in this order (after exact / base language tags).
 *
 * Adding a language (e.g. `fr`): append `"fr"` to `SITE_LOCALES`, set Studio i18n fields to use `fr`,
 * and use URLs `/fr`, `/fr/about`, … (each non-default locale gets a path prefix; do not use that
 * segment as a page slug for the default locale).
 */
export const SITE_LOCALES = ["en", "de"] as const;

export type SiteLocaleCode = (typeof SITE_LOCALES)[number];

/** URL without prefix (`/`, `/about`). Must be one of `SITE_LOCALES`. */
export const SITE_DEFAULT_LOCALE: SiteLocaleCode = "en";
