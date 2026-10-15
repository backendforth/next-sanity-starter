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
 * All public URL entries for a sitemap: home + work landing + slug-based
 * `page`/`project` documents. Settings singletons are omitted — they are not
 * public routes.
 *
 * - `path`: URL path from site root (`/` for home, `/work`, `/{slug}` for pages,
 *   `/work/{slug}` for projects).
 * Extend the filter when you add new routable types (see Studio `SITE_ROOT_DOCUMENT_TYPES`).
 */
export const sitemapPagesQuery = defineQuery(`*[
  _type == "home" ||
  _type == "work" ||
  (_type == "page" && defined(slug.current)) ||
  (_type == "project" && defined(slug.current))
]{
  _type,
  _updatedAt,
  "path": ${routePathProjection}
}`);
