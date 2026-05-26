/**
 * Routable document types for internal links. Extend when adding new page types.
 */
export const PAGE_REFERENCES = [{ type: "home" }, { type: "page" }] as const;

/** GROQ filter for reference pickers — home or published pages with a slug. */
export const PAGE_REFERENCE_FILTER =
  '_type == "home" || (_type == "page" && defined(slug.current))';
