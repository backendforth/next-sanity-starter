import { singletonTypesWithRole } from "../singletons";

/**
 * Document types that use `slug.current` → frontend path `/:slug`.
 * Add new routable document types here so Presentation can resolve the main
 * document when the iframe navigates to `/{slug}`.
 */
export const SLUG_BASED_DOCUMENT_TYPES = ["page"] as const;

/** Slug-based documents under a URL prefix (not site root). */
export const PREFIXED_SLUG_DOCUMENT_TYPES = ["project"] as const;

export const PROJECT_URL_PREFIX = "/work";

/**
 * Singletons that resolve Web Preview to `/` (same behaviour as the live site root).
 * Derived from the canonical singleton map (`config/singletons.ts`, role `root`).
 */
export const SITE_ROOT_DOCUMENT_TYPES = new Set(singletonTypesWithRole("root"));

/**
 * Document types where Presentation should not offer Web Preview locations
 * (settings-only). Derived from the canonical singleton map
 * (`config/singletons.ts`, role `none`). `errorSettings` uses role `custom`
 * and is handled in `locationsResolver.ts` instead.
 */
export const DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW = new Set(
  singletonTypesWithRole("none"),
);

/** Replaces the default “Used on N pages” label in the Presentation locations banner. */
export const PRESENTATION_LOCATIONS_HEADER = "Web Preview";
