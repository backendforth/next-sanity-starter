/**
 * Canonical declaration of every singleton schema type (documents backed by a
 * fixed id in the desk structure) and its Presentation web-preview role:
 *
 * - `root`   — Web Preview resolves to the site root `/` (e.g. `home`).
 * - `none`   — settings-only; Presentation offers no Web Preview link.
 * - `custom` — bespoke locations handled in `presentation/locationsResolver.ts`
 *              (e.g. `errorSettings` → `/404`, `/500`).
 *
 * This is the single source of truth: `presentation/conventions.ts` derives its
 * role-sets from this map, and `SINGLETON_SCHEMA_TYPES` (used to lock document
 * actions) is its key set. Add a new singleton here once and the delete/
 * unpublish/duplicate locks and Presentation behaviour follow automatically.
 */
export const SINGLETON_PREVIEW_ROLE = {
  home: "root",
  work: "custom",
  siteSettings: "none",
  siteLanguageSettings: "none",
  siteNav: "none",
  siteCookieBanner: "none",
  errorSettings: "custom",
} as const satisfies Record<string, "root" | "none" | "custom">;

export type SingletonSchemaType = keyof typeof SINGLETON_PREVIEW_ROLE;

/** Schema types backed by a fixed document id in structure (singletons). */
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

const LOCKED_SINGLETON_ACTIONS = new Set(["delete", "unpublish", "duplicate"]);

export function filterSingletonDocumentActions<T extends { action?: string }>(
  actions: T[],
  schemaType: string,
): T[] {
  if (!SINGLETON_SCHEMA_TYPES.has(schemaType)) {
    return actions;
  }
  return actions.filter((a) => !LOCKED_SINGLETON_ACTIONS.has(a.action ?? ""));
}
