/**
 * `module.contentRefs` (`objects/modules/moduleContentRefs.ts`) — references only `PAGE_REFERENCES` (home, page).
 */
export const moduleContentRefsInnerFields = `
  heading,
  allowMultiple,
  "reference": reference->{
    _id,
    _type,
    title,
    "slug": slug.current,
    "route": select(
      _type == "home" => "index",
      _type == "page" => "slug",
      "index"
    )
  },
  "references": references[]->{
    _id,
    _type,
    title,
    "slug": slug.current,
    "route": select(
      _type == "home" => "index",
      _type == "page" => "slug",
      "index"
    )
  }
`;

export const moduleContentRefsQuery = `_type == "module.contentRefs" => {
  ${moduleContentRefsInnerFields}
}`;
