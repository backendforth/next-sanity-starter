import { defineDocuments } from "sanity/presentation";

import {
  PREFIXED_SLUG_DOCUMENT_TYPES,
  PROJECT_URL_PREFIX,
  SLUG_BASED_DOCUMENT_TYPES,
} from "./conventions";
import { presentationLocationsResolver } from "./locationsResolver";

export { presentationLocationsResolver };

const typeList = (types: readonly string[]) =>
  types.map((t) => `"${t}"`).join(",");

/**
 * Which document opens when the Presentation iframe navigates to a route.
 * Home at `/`, `work` at `PROJECT_URL_PREFIX`, prefixed slugs below it, the other slugged types
 * at `/:slug` (`config/presentation/conventions.ts`).
 */
export const presentationMainDocuments = defineDocuments([
  { route: "/", type: "home" },
  { route: PROJECT_URL_PREFIX, type: "work" },
  {
    route: `${PROJECT_URL_PREFIX}/:slug`,
    filter: `_type in [${typeList(PREFIXED_SLUG_DOCUMENT_TYPES)}] && slug.current == $slug`,
  },
  ...(SLUG_BASED_DOCUMENT_TYPES.length > 0
    ? [
        {
          route: "/:slug",
          filter: `_type in [${typeList(SLUG_BASED_DOCUMENT_TYPES)}] && slug.current == $slug`,
        },
      ]
    : []),
]);
