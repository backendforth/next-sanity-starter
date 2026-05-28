import { defineDocuments } from "sanity/presentation";

import { SLUG_BASED_DOCUMENT_TYPES } from "./conventions";
import { presentationLocationsResolver } from "./locationsResolver";

export { presentationLocationsResolver };

const slugTypeList = SLUG_BASED_DOCUMENT_TYPES.map((t) => `"${t}"`).join(",");

/**
 * Which document opens when the Presentation iframe navigates to a route.
 *
 * The web app serves the default locale unprefixed (`/`, `/:slug`) and other
 * locales under `/:locale/…`. We register both shapes for every routable type
 * so editing any language variant lands on the right document:
 *
 * - `/`              → default-locale `home`
 * - `/:locale`       → `home` filtered by `language`
 * - `/:slug`         → default-locale slugged doc
 * - `/:locale/:slug` → slugged doc filtered by `language`
 *
 * Note: the default-locale routes do not constrain `language` because we don't
 * know the default at config-load time (it lives in `siteLanguageSettings`).
 * Presentation prefers the most specific match, so per-locale routes win when
 * the URL carries a `:locale` segment.
 */
export const presentationMainDocuments = defineDocuments([
  { route: "/", type: "home" },
  { route: "/:locale", filter: `_type == "home" && language == $locale` },
  ...(SLUG_BASED_DOCUMENT_TYPES.length > 0
    ? [
        {
          route: "/:slug",
          filter: `_type in [${slugTypeList}] && slug.current == $slug`,
        },
        {
          route: "/:locale/:slug",
          filter: `_type in [${slugTypeList}] && slug.current == $slug && language == $locale`,
        },
      ]
    : []),
]);
