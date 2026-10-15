import { map } from "rxjs";
import { getDraftId, getPublishedId } from "sanity";
import type {
  DocumentLocation,
  DocumentLocationResolver,
} from "sanity/presentation";

import {
  DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW,
  PREFIXED_SLUG_DOCUMENT_TYPES,
  PRESENTATION_LOCATIONS_HEADER,
  PROJECT_URL_PREFIX,
  SITE_ROOT_DOCUMENT_TYPES,
  SLUG_BASED_DOCUMENT_TYPES,
} from "./conventions";

const SLUG_TYPE_SET = new Set<string>(SLUG_BASED_DOCUMENT_TYPES);
const PREFIXED_SLUG_TYPE_SET = new Set<string>(PREFIXED_SLUG_DOCUMENT_TYPES);

/**
 * The edited document's slug and language, plus the site's default language. The listener
 * also watches `siteLanguageSettings`, so the paths follow a change of the default.
 */
const LOCATION_QUERY = {
  fetch: `*[_id in $ids][0]{
    "slug": slug.current,
    language,
    "defaultLanguage": *[_id == "siteLanguageSettings"][0].defaultLanguageId
  }`,
  listen: `*[_id in $ids || _id == "siteLanguageSettings"]`,
};

type LocationDoc = {
  slug?: string | null;
  language?: string | null;
  defaultLanguage?: string | null;
} | null;

/**
 * `path` as the web serves it in the document's language: unprefixed in the default language,
 * under `/{language}` in any other (`web/src/proxy.ts`).
 */
function localizedPath(path: string, doc: LocationDoc): string {
  const language = doc?.language?.trim();
  const prefixed = language && language !== doc?.defaultLanguage?.trim();
  return (prefixed ? `/${language}${path}` : path) || "/";
}

/** The locations of a document of `type`, each in the document's language. */
function locationsFor(type: string, doc: LocationDoc): DocumentLocation[] {
  const home = { title: "Home", href: localizedPath("", doc) };
  if (SITE_ROOT_DOCUMENT_TYPES.has(type)) {
    return [home];
  }
  if (type === "errorSettings") {
    return [{ title: "404", href: localizedPath("/404", doc) }];
  }
  if (type === "work") {
    const path = localizedPath(PROJECT_URL_PREFIX, doc);
    return [{ title: path, href: path }, home];
  }
  const prefix = PREFIXED_SLUG_TYPE_SET.has(type) ? PROJECT_URL_PREFIX : "";
  const slug = doc?.slug?.trim();
  if (slug) {
    const path = localizedPath(`${prefix}/${slug}`, doc);
    return [{ title: path, href: path }, home];
  }
  return [
    prefix
      ? {
          title: "Project (set path first)",
          href: localizedPath(PROJECT_URL_PREFIX, doc),
        }
      : { title: "Page (set path first)", href: home.href },
  ];
}

/**
 * Central Presentation `resolve.locations`: site-root singletons → the custom-role singletons
 * (`errorSettings` → the 404 page, `work` → its landing) → slug-based types
 * (`SLUG_BASED_DOCUMENT_TYPES`, `PREFIXED_SLUG_DOCUMENT_TYPES`). Any other type has no route of
 * its own (`projectCategory`), so it gets no locations. One document per language: every
 * location is in its language.
 */
export const presentationLocationsResolver: DocumentLocationResolver = (
  params,
  context,
) => {
  const { id, type } = params;

  if (
    DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW.has(type) ||
    !(
      SITE_ROOT_DOCUMENT_TYPES.has(type) ||
      type === "errorSettings" ||
      type === "work" ||
      SLUG_TYPE_SET.has(type) ||
      PREFIXED_SLUG_TYPE_SET.has(type)
    )
  ) {
    return null;
  }

  const ids = Array.from(
    new Set([getPublishedId(id), getDraftId(id)].map(String)),
  );

  return context.documentStore
    .listenQuery(LOCATION_QUERY, { ids }, { perspective: "drafts" })
    .pipe(
      map((doc: LocationDoc) => ({
        message: PRESENTATION_LOCATIONS_HEADER,
        locations: locationsFor(type, doc),
      })),
    );
};
