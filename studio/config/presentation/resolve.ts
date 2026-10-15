import { defineDocuments } from "sanity/presentation";

import {
  LANGUAGE_IDS,
  PREFIXED_SLUG_DOCUMENT_TYPES,
  PROJECT_URL_PREFIX,
  SITE_ROOT_DOCUMENT_TYPES,
  SLUG_BASED_DOCUMENT_TYPES,
} from "./conventions";
import { presentationLocationsResolver } from "./locationsResolver";

export { presentationLocationsResolver };

const typeList = (types: readonly string[]) =>
  types.map((t) => `"${t}"`).join(",");
const rootFilter = `_type in [${typeList([...SITE_ROOT_DOCUMENT_TYPES])}]`;
const prefixedFilter = `_type in [${typeList(PREFIXED_SLUG_DOCUMENT_TYPES)}] && slug.current == $slug`;
const slugTypeList = typeList(SLUG_BASED_DOCUMENT_TYPES);

/**
 * Which document opens when the Presentation iframe navigates to a route.
 * The site-root singleton at `/`, `work` at `PROJECT_URL_PREFIX`, prefixed slugs below it, the
 * other slugged types at `/:slug` (`config/presentation/conventions.ts`).
 *
 * The web serves the default locale unprefixed and the others under `/:locale/…`. One document
 * holds every language, so a prefixed route opens the same document. Presentation takes the
 * first route that matches: the literal `work` routes come before the `:locale` patterns, and a
 * single segment (`/de` or `/about`) is a locale when it is one of the language ids, never a
 * page (the web serves the locale's home there too).
 */
export const presentationMainDocuments = defineDocuments([
  { route: "/", filter: rootFilter },
  { route: PROJECT_URL_PREFIX, type: "work" },
  { route: `${PROJECT_URL_PREFIX}/:slug`, filter: prefixedFilter },
  { route: `/:locale${PROJECT_URL_PREFIX}`, type: "work" },
  { route: `/:locale${PROJECT_URL_PREFIX}/:slug`, filter: prefixedFilter },
  {
    route: "/:segment",
    filter:
      SLUG_BASED_DOCUMENT_TYPES.length > 0
        ? `(${rootFilter} && $segment in ${LANGUAGE_IDS}) || (_type in [${slugTypeList}] && slug.current == $segment && !($segment in ${LANGUAGE_IDS}))`
        : `${rootFilter} && $segment in ${LANGUAGE_IDS}`,
  },
  ...(SLUG_BASED_DOCUMENT_TYPES.length > 0
    ? [
        {
          route: "/:locale/:slug",
          filter: `_type in [${slugTypeList}] && slug.current == $slug`,
        },
      ]
    : []),
]);
