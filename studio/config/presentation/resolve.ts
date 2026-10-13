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
 * - `/`                   → default-locale `home`
 * - `/work`               → default-locale `work` landing
 * - `/work/:slug`         → default-locale `project`
 * - `/:locale/work`       → `work` landing filtered by `language`
 * - `/:locale/work/:slug` → `project` filtered by `language`
 * - `/:segment`           → `home` in that language, or a default-locale slugged doc
 * - `/:locale/:slug`      → slugged doc filtered by `language`
 *
 * Presentation takes the FIRST resolver whose route matches (`useMainDocument`
 * stops at the first hit), so order matters: the literal `work` routes come
 * before the `:locale` patterns they would otherwise be swallowed by. A single
 * segment can't be told apart by shape (`/de` is a locale, `/about` a slug),
 * so one filter covers both.
 *
 * Note: the default-locale routes do not constrain `language` because we don't
 * know the default at config-load time (it lives in `siteLanguageSettings`).
 */
export const presentationMainDocuments = defineDocuments([
  { route: "/", type: "home" },
  { route: "/work", type: "work" },
  {
    route: "/work/:slug",
    filter: `_type == "project" && slug.current == $slug`,
  },
  {
    route: "/:locale/work",
    filter: `_type == "work" && language == $locale`,
  },
  {
    route: "/:locale/work/:slug",
    filter: `_type == "project" && slug.current == $slug && language == $locale`,
  },
  {
    route: "/:segment",
    filter:
      SLUG_BASED_DOCUMENT_TYPES.length > 0
        ? `(_type == "home" && language == $segment) || (_type in [${slugTypeList}] && slug.current == $segment)`
        : `_type == "home" && language == $segment`,
  },
  ...(SLUG_BASED_DOCUMENT_TYPES.length > 0
    ? [
        {
          route: "/:locale/:slug",
          filter: `_type in [${slugTypeList}] && slug.current == $slug && language == $locale`,
        },
      ]
    : []),
]);
