import { defineQuery } from "next-sanity";

import { routePathProjection } from "./routePath";
import { translationsQuery } from "./translations";

/**
 * Minimal list of routable page slugs across all languages — for
 * `generateStaticParams` and simple slug lists. Home is excluded (it lives
 * at `/` / `/:locale`, not under `[slug]`).
 */
export const pageSlugsQuery =
	defineQuery(`*[_type == "page" && defined(slug.current)]{
  "slug": slug.current,
  language
}`);

/** Same as {@link pageSlugsQuery} but for `project` documents (`/work/:slug`). */
export const projectSlugsQuery =
	defineQuery(`*[_type == "project" && defined(slug.current)]{
  "slug": slug.current,
  language
}`);

/**
 * Every routable document in every language with its `path` (`routePathProjection`, which
 * decides what has a route; without the locale prefix, the route layer adds it per `language`):
 * home, the work landing, pages and projects. One row per language variant; `translations` lists
 * every variant of the row (itself included) for the sitemap's `hreflang` alternates. Add a new
 * routable type to this list and to `routePathProjection`.
 */
export const sitemapPagesQuery =
	defineQuery(`*[_type in ["home", "work", "page", "project"]]{
  _type,
  _updatedAt,
  language,
  "path": ${routePathProjection},
  ${translationsQuery}
}[defined(path)]`);
