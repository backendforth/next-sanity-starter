/**
 * Portable Text annotation for `link` objects (`studio/schemas/objects/link.ts`).
 * Types: `internal` | `external` | `function` — matches schema only (no download/cookie variants).
 * `func` matches `linkFunctions` (`key`, `params`).
 *
 * Internal link labels are resolved in the app via `resolveLinkLabel` (not GROQ `coalesce` on
 * `reference->title`, which is an i18n array on field-level documents).
 */
export const linkQuery = `
  ...,
  type == "internal" => {
    "linkType": "linkInternal",
    title,
    "route": select(
      reference->_type == "home" => "page",
      reference->_type == "page" => "slug",
      reference->_type == "work" => "work",
      reference->_type == "project" => "project",
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
