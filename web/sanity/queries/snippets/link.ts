/**
 * Portable Text annotation and nav row for `link` objects (`studio/schemas/objects/link.ts`).
 * Types: `internal` | `external` | `function` — matches schema only (no download/cookie variants).
 *
 * One `select` branch per type, so TypeGen emits one union member per type, told apart by
 * `linkType`. `title` is an `internationalizedArrayString`; the frontend resolves the label via
 * `resolveLinkLabel`, falling back to the referenced document's title for internal links.
 *
 * `func` matches `linkFunctions` (`key`, `params`).
 */
export const linkQuery = `
  _key,
  _type,
  type,
  title,
  ...select(
    type == "internal" => {
      "linkType": "linkInternal",
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
      "linkType": "linkExternal",
      url,
      "href": url,
      blank
    },
    type == "function" => {
      "linkType": "linkFunction",
      "func": func {
        key,
        params
      }
    }
  )
`;
