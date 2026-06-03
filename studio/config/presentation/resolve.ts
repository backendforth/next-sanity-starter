import { defineDocuments } from "sanity/presentation";

import { SLUG_BASED_DOCUMENT_TYPES } from "./conventions";
import { presentationLocationsResolver } from "./locationsResolver";

export { presentationLocationsResolver };

const slugTypeList = SLUG_BASED_DOCUMENT_TYPES.map((t) => `"${t}"`).join(",");

/**
 * Which document opens when the Presentation iframe navigates to a route.
 * Home at `/`; slugged types share `/:slug` (see `SLUG_BASED_DOCUMENT_TYPES`).
 */
export const presentationMainDocuments = defineDocuments([
  { route: "/", type: "home" },
  { route: "/work", type: "work" },
  {
    route: "/work/:slug",
    filter: `_type == "project" && slug.current == $slug`,
  },
  ...(SLUG_BASED_DOCUMENT_TYPES.length > 0
    ? [
        {
          route: "/:slug",
          filter: `_type in [${slugTypeList}] && slug.current == $slug`,
        },
      ]
    : []),
]);
