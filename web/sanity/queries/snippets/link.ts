/**
 * Portable Text annotation for `link` objects (`studio/schemas/objects/link.ts`).
 * Types: `internal` | `external` | `function` — matches schema only (no download/cookie variants).
 * `func` matches `linkFunctions` (`key`, `params`).
 */
export const linkQuery = `
  ...,
  type == "internal" => {
    "linkType": "linkInternal",
    "title": coalesce(title, reference->title),
    "route": select(
      reference->_type == "home" => "page",
      reference->_type == "page" => "slug",
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
    "title": coalesce(title, url),
    blank
  },
  type == "function" => {
    ...,
    "linkType": "linkFunction",
    "func": func {
      key,
      params
    }
  }
`;
