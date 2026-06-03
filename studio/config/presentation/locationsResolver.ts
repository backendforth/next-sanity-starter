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
 * Builds the web URL for a slugged document. Always emits the language-prefixed
 * path — the web app's `proxy.ts` redirects the default-locale prefix to the
 * canonical unprefixed URL, so Presentation lands in the right place either way.
 */
function localizedSlugPath(
  slug: string,
  language?: string | null,
  prefix = "",
): string {
  const lang = typeof language === "string" ? language.trim() : "";
  const base = `${prefix}/${slug}`;
  if (!lang) return base;
  return `/${lang}${base}`;
}

function localizedFixedPath(path: string, language?: string | null): string {
  const lang = typeof language === "string" ? language.trim() : "";
  if (!lang) return path;
  return `/${lang}${path}`;
}

const WORK_INDEX_QUERY = `*[_id in $ids][0]{ language }`;

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
 * work landing → slug-based (from `SLUG_BASED_DOCUMENT_TYPES` /
 * `PREFIXED_SLUG_DOCUMENT_TYPES` or any doc with `slug.current`).
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

  if (type === "work") {
    return context.documentStore
      .listenQuery(WORK_INDEX_QUERY, { ids }, { perspective: "drafts" })
      .pipe(
        map((doc: { language?: string | null } | null) => {
          const workPath = localizedFixedPath(
            PROJECT_URL_PREFIX,
            doc?.language,
          );
          return {
            message: PRESENTATION_LOCATIONS_HEADER,
            locations: [
              { title: workPath, href: workPath },
              { title: "Home", href: "/" },
            ],
          };
        }),
      );
  }

  return context.documentStore
    .listenQuery(SLUG_QUERY, { ids }, { perspective: "drafts" })
    .pipe(
      map((doc: { slug?: string; language?: string | null } | null) => {
        const rawSlug = doc?.slug;
        const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";

        if (slug) {
          const prefix = PREFIXED_SLUG_TYPE_SET.has(type)
            ? PROJECT_URL_PREFIX
            : "";
          const path = localizedSlugPath(slug, doc?.language, prefix);
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
