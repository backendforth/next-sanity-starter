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
 * role-sets from this map, and `SINGLETON_DEFINITIONS` (registered with the
 * Studio) is its key set. Add a new singleton here once and the Create-menu
 * filter, the action locks and Presentation behaviour follow automatically.
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

/** Schema types whose role matches `role`. */
export function singletonTypesWithRole(
  role: (typeof SINGLETON_PREVIEW_ROLE)[SingletonSchemaType],
): string[] {
  return Object.entries(SINGLETON_PREVIEW_ROLE)
    .filter(([, value]) => value === role)
    .map(([type]) => type);
}

/**
 * `document.singletons` (Studio singletons API, beta). Each singleton's `_id` is its schema type,
 * so the string shorthand registers it: definition id = document id = schema type. Registered,
 * a singleton gets no Create-menu or reference-input "Create new" entry and no duplicate action;
 * structure items open it with `S.listItem().singleton(<type>)`.
 */
export const SINGLETON_DEFINITIONS: SingletonSchemaType[] = Object.keys(
  SINGLETON_PREVIEW_ROLE,
) as SingletonSchemaType[];

/**
 * The Studio only drops `duplicate` for a registered singleton. Deleting or unpublishing one
 * would leave the site without the document it reads by fixed `_id`.
 */
const LOCKED_SINGLETON_ACTIONS = new Set(["delete", "unpublish"]);

/** `singleton` is the definition id the Studio passes to `document.actions` for a singleton. */
export function filterSingletonDocumentActions<T extends { action?: string }>(
  actions: T[],
  singleton: string | undefined,
): T[] {
  if (singleton === undefined) {
    return actions;
  }
  return actions.filter((a) => !LOCKED_SINGLETON_ACTIONS.has(a.action ?? ""));
}
