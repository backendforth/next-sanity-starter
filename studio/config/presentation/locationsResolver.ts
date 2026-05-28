import { map } from "rxjs";
import { getDraftId, getPublishedId } from "sanity";
import type {
  DocumentLocationResolver,
  DocumentLocationsState,
} from "sanity/presentation";

import {
  DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW,
  PRESENTATION_LOCATIONS_HEADER,
  SITE_ROOT_DOCUMENT_TYPES,
  SLUG_BASED_DOCUMENT_TYPES,
} from "./conventions";

const SLUG_TYPE_SET = new Set<string>(SLUG_BASED_DOCUMENT_TYPES);

const SLUG_QUERY = `*[_id in $ids][0]{ "slug": slug.current, language }`;

/**
 * Builds the web URL for a slugged document. Always emits the language-prefixed
 * path — the web app's `proxy.ts` redirects the default-locale prefix to the
 * canonical unprefixed URL, so Presentation lands in the right place either way.
 */
function localizedPath(slug: string, language?: string | null): string {
  const lang = typeof language === "string" ? language.trim() : "";
  if (!lang) return `/${slug}`;
  return `/${lang}/${slug}`;
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
      map((doc: { slug?: string; language?: string | null } | null) => {
        const rawSlug = doc?.slug;
        const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";

        if (slug) {
          const path = localizedPath(slug, doc?.language);
          return {
            message: PRESENTATION_LOCATIONS_HEADER,
            locations: [
              { title: path, href: path },
              { title: "Home", href: "/" },
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
