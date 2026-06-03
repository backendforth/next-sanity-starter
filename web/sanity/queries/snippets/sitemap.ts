import { defineQuery } from "next-sanity";

/**
 * Minimal list of routable pages — for `generateStaticParams` and simple slug lists.
 * (Home lives at `/`, not under `[slug]`, so it is not included here.)
 */
export const pageSlugsQuery =
	defineQuery(`*[_type == "page" && defined(slug.current)]{
  "slug": slug.current
}`);

/**
 * All public URL entries for a sitemap: slug-based `page` documents plus site-root
 * singletons (e.g. `home`). Settings singletons are omitted — they are not public routes.
 *
 * - `path`: URL path from site root (`/` for home, `/{slug}` for pages).
 * Extend the filter when you add new routable singletons (see Studio `SITE_ROOT_DOCUMENT_TYPES`).
 */
export const projectSlugsQuery =
	defineQuery(`*[_type == "project" && defined(slug.current)]{
  "slug": slug.current
}`);

export const sitemapPagesQuery = defineQuery(`*[
  _type == "home" ||
  _type == "work" ||
  (_type == "page" && defined(slug.current)) ||
  (_type == "project" && defined(slug.current))
]{
  _id,
  _type,
  _updatedAt,
  "slug": select(
    _type in ["home", "work"] => null,
    slug.current
  ),
  "path": select(
    _type == "home" => "/",
    _type == "work" => "/work",
    _type == "project" => "/work/" + slug.current,
    "/" + slug.current
  )
}`);
