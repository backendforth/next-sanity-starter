/**
 * Routable document types for internal links. Extend when adding new page types.
 */
export const PAGE_REFERENCES = [{ type: "home" }, { type: "page" }] as const;

/** GROQ filter for reference pickers — home or published pages with a slug. */
export const PAGE_REFERENCE_FILTER =
  '_type == "home" || (_type == "page" && defined(slug.current))';

export const PROJECT_REFERENCES = [{ type: "project" }] as const;

export const PROJECT_REFERENCE_FILTER =
  '_type == "project" && defined(slug.current)';

export const CONTENT_REF_SOURCE_SCOPES = ["all", "pages", "projects"] as const;
export type ContentRefSourceScope = (typeof CONTENT_REF_SOURCE_SCOPES)[number];

export const CONTENT_REF_SELECTION_MODES = ["all", "selected"] as const;
export type ContentRefSelectionMode =
  (typeof CONTENT_REF_SELECTION_MODES)[number];

/** Document `_type` values included for a content-refs `sourceScope`. */
export function contentRefTypesForScope(
  scope: ContentRefSourceScope = "all",
): string[] {
  switch (scope) {
    case "pages":
      return ["home", "page"];
    case "projects":
      return ["project"];
    default:
      return ["home", "page", "project"];
  }
}

/** Reference picker `to` types for `module.contentRefs`. */
export function contentRefReferenceTo(scope: ContentRefSourceScope = "all") {
  switch (scope) {
    case "pages":
      return [...PAGE_REFERENCES];
    case "projects":
      return [...PROJECT_REFERENCES];
    default:
      return [...PAGE_REFERENCES, ...PROJECT_REFERENCES];
  }
}

/** GROQ filter for content-refs reference pickers. */
export function contentRefReferenceFilter(
  scope: ContentRefSourceScope = "all",
): string {
  switch (scope) {
    case "pages":
      return PAGE_REFERENCE_FILTER;
    case "projects":
      return PROJECT_REFERENCE_FILTER;
    default:
      return `${PAGE_REFERENCE_FILTER} || (${PROJECT_REFERENCE_FILTER})`;
  }
}
