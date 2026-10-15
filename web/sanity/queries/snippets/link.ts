import { routePathProjection } from "./routePath";

/**
 * Portable Text annotation and nav row for `link` objects (`studio/schemas/objects/link.ts`).
 * Types: `internal` | `external` | `function` — matches schema only (no download/cookie variants).
 *
 * One `select` branch per type, so TypeGen emits one union member per type, told apart by
 * `linkType`. Internal link labels are resolved in the app via `resolveLinkLabel`, falling back
 * to the referenced document's title (same language, plain string on this branch).
 *
 * An internal link carries its target's `path` (`routePathProjection`); a reference to a deleted
 * or unpublished document resolves to `null` and renders as plain text.
 *
 * `func` matches `linkFunctions` (`key`).
 */
export const linkQuery = `
  _key,
  _type,
  title,
  ...select(
    type == "internal" => {
      "linkType": "linkInternal",
      "resolvedReference": reference->{
        title,
        "path": ${routePathProjection}
      }
    },
    type == "external" => {
      "linkType": "linkExternal",
      url,
      blank
    },
    type == "function" => {
      "linkType": "linkFunction",
      "func": func { key }
    }
  )
`;
