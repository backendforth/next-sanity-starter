/**
 * Page-like routable document types: content-refs "pages" scope and internal links. Extend when
 * adding new page types.
 */
export const PAGE_REFERENCES = [{ type: "home" }, { type: "page" }] as const;

/** GROQ filter for reference pickers — home or published pages with a slug. */
export const PAGE_REFERENCE_FILTER =
  '_type == "home" || (_type == "page" && defined(slug.current))';

export const PROJECT_REFERENCES = [{ type: "project" }] as const;

export const PROJECT_REFERENCE_FILTER =
  '_type == "project" && defined(slug.current)';

/** Everything an internal link can open: the pages, the Work landing and its projects. */
export const LINK_REFERENCES = [
  ...PAGE_REFERENCES,
  { type: "work" },
  ...PROJECT_REFERENCES,
] as const;

export const LINK_REFERENCE_FILTER = `${PAGE_REFERENCE_FILTER} || _type == "work" || (${PROJECT_REFERENCE_FILTER})`;

export const CONTENT_REF_SOURCE_SCOPES = ["all", "pages", "projects"] as const;
export type ContentRefSourceScope = (typeof CONTENT_REF_SOURCE_SCOPES)[number];

export const CONTENT_REF_SELECTION_MODES = ["all", "selected"] as const;
export type ContentRefSelectionMode =
  (typeof CONTENT_REF_SELECTION_MODES)[number];

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

/**
 * Reference-picker `options` fragment: list suggestions newest first.
 *
 * An empty picker search is ranked by a relevance `_score` that ties across
 * every candidate, so the order looks arbitrary. `sort` becomes the search
 * query's `order()` clause, applied before the result slice, so the document an
 * editor just created is on top. Spread it into a reference field's `options`
 * next to `filter`.
 *
 * `sort` is `@internal` in Sanity (absent from the public `ReferenceOptions`
 * type), which is why it lives in this one constant: an upgrade may drop it,
 * and suggestions then fall back to the default order without breaking. It
 * also replaces relevance ranking for typed queries in the picker.
 */
export const NEWEST_FIRST_SUGGESTIONS = {
  sort: [{ field: "_createdAt", direction: "desc" as const }],
};
