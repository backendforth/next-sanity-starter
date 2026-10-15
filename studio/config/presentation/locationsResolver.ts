import { map } from "rxjs";
import { getDraftId, getPublishedId } from "sanity";
import type {
  DocumentLocationResolver,
  DocumentLocationsState,
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

const SLUG_QUERY = `*[_id in $ids][0]{ "slug": slug.current, language }`;

/**
 * `path` under the document's language prefix. Always prefixed: the web app's `proxy.ts`
 * redirects the default-locale prefix to the canonical unprefixed URL, so Presentation lands in
 * the right place either way.
 */
function localizedPath(path: string, language?: string | null): string {
  const lang = language?.trim();
  return (lang ? `/${lang}${path}` : path) || "/";
}

/**
 * Types that need fully custom locations (no convention).
 * Extend here for one-off behaviour.
 */
function staticLocationsForType(
  type: string,
): DocumentLocationsState | undefined {
  if (type === "errorSettings") {
    return {
      message: PRESENTATION_LOCATIONS_HEADER,
      locations: [
        { title: "404", href: "/404" },
        { title: "500", href: "/500" },
      ],
    };
  }
  return undefined;
}

/**
 * Central Presentation `resolve.locations`: overrides → site-root singletons → work landing →
 * slug-based (from `SLUG_BASED_DOCUMENT_TYPES` / `PREFIXED_SLUG_DOCUMENT_TYPES` or any doc
 * with `slug.current`). One document per language: every location carries its prefix.
 */
export const presentationLocationsResolver: DocumentLocationResolver = (
  params,
  context,
) => {
  const { id, type } = params;

  const manual = staticLocationsForType(type);
  if (manual !== undefined) {
    return manual;
  }

  if (DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW.has(type)) {
    return null;
  }

  const ids = Array.from(
    new Set([getPublishedId(id), getDraftId(id)].map(String)),
  );

  return context.documentStore
    .listenQuery(SLUG_QUERY, { ids }, { perspective: "drafts" })
    .pipe(
      map((doc: { slug?: string; language?: string | null } | null) => {
        const home = { title: "Home", href: localizedPath("", doc?.language) };

        if (SITE_ROOT_DOCUMENT_TYPES.has(type)) {
          return {
            message: PRESENTATION_LOCATIONS_HEADER,
            locations: [
              {
                title: type === "home" ? "Home" : "Site preview (home)",
                href: home.href,
              },
            ],
          };
        }

        if (type === "work") {
          const workPath = localizedPath(PROJECT_URL_PREFIX, doc?.language);
          return {
            message: PRESENTATION_LOCATIONS_HEADER,
            locations: [{ title: workPath, href: workPath }, home],
          };
        }

        const slug = doc?.slug?.trim();
        if (slug) {
          const prefix = PREFIXED_SLUG_TYPE_SET.has(type)
            ? PROJECT_URL_PREFIX
            : "";
          const path = localizedPath(`${prefix}/${slug}`, doc?.language);
          return {
            message: PRESENTATION_LOCATIONS_HEADER,
            locations: [{ title: path, href: path }, home],
          };
        }

        if (PREFIXED_SLUG_TYPE_SET.has(type)) {
          return {
            message: PRESENTATION_LOCATIONS_HEADER,
            locations: [
              {
                title: "Project (set path first)",
                href: PROJECT_URL_PREFIX,
              },
            ],
          };
        }

        if (SLUG_TYPE_SET.has(type)) {
          return {
            message: PRESENTATION_LOCATIONS_HEADER,
            locations: [
              {
                title: "Page (set path first)",
                href: "/",
              },
            ],
          };
        }

        return {
          message: PRESENTATION_LOCATIONS_HEADER,
          tone: "caution" as const,
          locations: [{ title: "Site (root)", href: "/" }],
        };
      }),
    );
};
