/**
 * Canonical declaration of every singleton schema type (documents opened from
 * the desk structure, not from a Create menu) and its Presentation web-preview role:
 *
 * - `root`   — Web Preview resolves to the site root `/` (e.g. `home`).
 * - `none`   — settings-only; Presentation offers no Web Preview link.
 * - `custom` — bespoke locations handled in `presentation/locationsResolver.ts`
 *              (e.g. `errorSettings` → `/404`).
 *
 * This is the single source of truth: `presentation/conventions.ts` derives its
 * role-sets from this map, and `SINGLETON_SCHEMA_TYPES` (kept out of the Create
 * menus) is its key set. Add a new singleton here once and the Create-menu filter
 * and Presentation behaviour follow automatically; which singletons lock their
 * delete/unpublish/duplicate actions is `FIXED_ID_SINGLETON_TYPES` below.
 */
export const SINGLETON_PREVIEW_ROLE = {
  home: "root",
  work: "custom",
  siteSettings: "none",
  siteLanguageSettings: "none",
  siteNav: "none",
  siteCookieBanner: "none",
  siteAnalyticsSettings: "none",
  errorSettings: "custom",
} as const satisfies Record<string, "root" | "none" | "custom">;

export type SingletonSchemaType = keyof typeof SINGLETON_PREVIEW_ROLE;

/** Singleton schema types: opened from the structure, not from a Create menu. */
export const SINGLETON_SCHEMA_TYPES = new Set<string>(
  Object.keys(SINGLETON_PREVIEW_ROLE),
);

/** Schema types whose role matches `role`. */
export function singletonTypesWithRole(
  role: (typeof SINGLETON_PREVIEW_ROLE)[SingletonSchemaType],
): string[] {
  return Object.entries(SINGLETON_PREVIEW_ROLE)
    .filter(([, value]) => value === role)
    .map(([type]) => type);
}

/**
 * Singletons are opened from the structure, never created from a "Create" menu or a
 * reference input: the site reads one document of the type (per language, where the type is
 * translatable), and the structure is where that one is managed. Their only templates are the
 * defaults, whose id is the schema type.
 */
export function isSingletonTemplate(templateId: string): boolean {
  return SINGLETON_SCHEMA_TYPES.has(templateId);
}

/**
 * Singletons the site reads by their fixed `_id`, one document for every language. Deleting,
 * unpublishing or duplicating one leaves the site without it or with a copy nothing reads, so
 * those actions are locked. The per-language singletons are one document per language and keep
 * them, like any document: a stray second document in a language (`onePerLanguage` blocks its
 * publish) or an unwanted language version can be deleted.
 */
const FIXED_ID_SINGLETON_TYPES = new Set<string>([
  "siteLanguageSettings",
  "siteAnalyticsSettings",
] satisfies SingletonSchemaType[]);

const LOCKED_SINGLETON_ACTIONS = new Set(["delete", "unpublish", "duplicate"]);

export function filterSingletonDocumentActions<T extends { action?: string }>(
  actions: T[],
  schemaType: string,
): T[] {
  if (!FIXED_ID_SINGLETON_TYPES.has(schemaType)) {
    return actions;
  }
  return actions.filter((a) => !LOCKED_SINGLETON_ACTIONS.has(a.action ?? ""));
}
