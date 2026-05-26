/** Schema types backed by a fixed document id in structure (singletons). */
export const SINGLETON_SCHEMA_TYPES = new Set([
  "home",
  "siteSettings",
  "siteNav",
  "siteLanguageSettings",
  "errorSettings",
  "siteCookieBanner",
]);

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
