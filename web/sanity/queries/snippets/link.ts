/**
 * Portable Text annotation for `link` objects (`studio/schemas/objects/link.ts`).
 * Types: `internal` | `external` | `function` — matches schema only (no download/cookie variants).
 *
 * `title` is an `internationalizedArrayString` (per-locale entries). The frontend resolves the
 * label via `resolveLinkLabel(linkTitle, referenceTitle, locale)` — falling back to the
 * referenced document title for internal links.
 *
 * `func` matches `linkFunctions` (`key`, `params`).
 */
export const linkQuery = `
  ...,
  type == "internal" => {
    "linkType": "linkInternal",
    title,
    "route": select(
      reference->_type == "home" => "page",
      reference->_type == "page" => "slug",
      reference->_type == "project" => "project",
      reference->_type == "work" => "work",
      "page"
    ),
    "slug": reference->slug.current,
    "resolvedReference": reference->{
      _id,
      _type,
      title,
      "slug": slug.current
    }
  },
  type == "external" => {
    ...,
    "linkType": "linkExternal",
    "href": url,
    title,
    blank
  },
  type == "function" => {
    ...,
    "linkType": "linkFunction",
    title,
    "func": func {
      key,
      params
    }
  }
`;
