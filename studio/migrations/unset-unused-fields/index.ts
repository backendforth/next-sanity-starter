import { at, defineMigration, unset } from "sanity/migrate";

/**
 * Unsets stored fields no schema declares, which the Studio shows as unknown fields: the hidden
 * `title` that only fed the settings singletons' previews, the 500-page copy `errorSettings` no
 * longer has, and `cookieFree` on the trackers whose consent the web decides by type (Clarity,
 * Plausible). Missing fields are skipped, so a re-run is safe.
 *
 * How and when to run it: `scripts/README.md` → "Content migrations".
 */

const UNUSED_DOCUMENT_FIELDS: Record<string, string[]> = {
  siteNav: ["title"],
  siteCookieBanner: ["title"],
  siteAnalyticsSettings: ["title"],
  siteLanguageSettings: ["title"],
  errorSettings: ["serverErrorTitle", "serverErrorBody"],
};

const TRACKERS_WITHOUT_COOKIE_FREE = new Set([
  "trackerMicrosoftClarity",
  "trackerPlausible",
]);

export default defineMigration({
  title: "Unset fields no schema declares",
  documentTypes: Object.keys(UNUSED_DOCUMENT_FIELDS),
  migrate: {
    document(doc) {
      return (UNUSED_DOCUMENT_FIELDS[doc._type] ?? [])
        .filter((field) => doc[field] !== undefined)
        .map((field) => at(field, unset()));
    },
    object(node) {
      if (
        typeof node._type === "string" &&
        TRACKERS_WITHOUT_COOKIE_FREE.has(node._type) &&
        node.cookieFree !== undefined
      ) {
        return at("cookieFree", unset());
      }
    },
  },
});
