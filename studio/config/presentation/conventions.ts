/**
 * Document types that use `slug.current` → frontend path `/:slug`.
 * Add new routable document types here so Presentation can resolve the main
 * document when the iframe navigates to `/{slug}`.
 */
export const SLUG_BASED_DOCUMENT_TYPES = ["page"] as const;

/**
 * Singletons that resolve Web Preview to `/` (same behaviour as the live site root).
 * Site-wide settings (`siteSettings`, `siteNav`, `siteCookieBanner`) are listed in
 * `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW` instead so editors do not get a preview link.
 */
export const SITE_ROOT_DOCUMENT_TYPES = new Set(["home"]);

/**
 * Document types where Presentation should not offer Web Preview locations (settings-only).
 */
export const DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW = new Set([
  "siteSettings",
  "siteNav",
  "siteCookieBanner",
]);

/** Replaces the default “Used on N pages” label in the Presentation locations banner. */
export const PRESENTATION_LOCATIONS_HEADER = "Web Preview";
