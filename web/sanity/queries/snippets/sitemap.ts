import { defineQuery } from "next-sanity";

import { routePathProjection } from "./routePath";

/**
 * Minimal list of routable pages — for `generateStaticParams` and simple slug lists.
 * (Home lives at `/`, not under `[slug]`, so it is not included here.)
 */
export const pageSlugsQuery =
	defineQuery(`*[_type == "page" && defined(slug.current)]{
  "slug": slug.current
}`);

/** Same as {@link pageSlugsQuery} but for `project` documents (`/work/:slug`). */
export const projectSlugsQuery =
	defineQuery(`*[_type == "project" && defined(slug.current)]{
  "slug": slug.current
}`);

/**
 * Every routable document with its `path` (`routePathProjection`, which decides what has a
 * route): home, the work landing, pages and projects. Add a new routable type to this list and
 * to `routePathProjection`.
 */
export const sitemapPagesQuery =
	defineQuery(`*[_type in ["home", "work", "page", "project"]]{
  _type,
  _updatedAt,
  "path": ${routePathProjection}
}[defined(path)]`);
