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

const SLUG_QUERY = `*[_id in $ids][0]{ "slug": slug.current }`;

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
  if (type === "work") {
    return {
      message: PRESENTATION_LOCATIONS_HEADER,
      locations: [
        { title: "/work", href: "/work" },
        { title: "Home", href: "/" },
      ],
    };
  }
  return undefined;
}

/**
 * Central Presentation `resolve.locations`: overrides → site-root singletons →
 * slug-based (from `SLUG_BASED_DOCUMENT_TYPES` or any doc with `slug.current`).
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

  if (SITE_ROOT_DOCUMENT_TYPES.has(type)) {
    return {
      message: PRESENTATION_LOCATIONS_HEADER,
      locations: [
        {
          title: type === "home" ? "Home" : "Site preview (home)",
          href: "/",
        },
      ],
    };
  }

  const ids = Array.from(
    new Set([getPublishedId(id), getDraftId(id)].map(String)),
  );

  return context.documentStore
    .listenQuery(SLUG_QUERY, { ids }, { perspective: "drafts" })
    .pipe(
      map((doc: { slug?: string } | null) => {
        const raw = doc?.slug;
        const slug = typeof raw === "string" ? raw.trim() : "";

        if (slug) {
          const path = PREFIXED_SLUG_TYPE_SET.has(type)
            ? `${PROJECT_URL_PREFIX}/${slug}`
            : `/${slug}`;
          return {
            message: PRESENTATION_LOCATIONS_HEADER,
            locations: [
              { title: path, href: path },
              { title: "Home", href: "/" },
            ],
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
