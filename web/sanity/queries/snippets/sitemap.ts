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
export const sitemapPagesQuery =
	defineQuery(`*[_type == "home" || (_type == "page" && defined(slug.current))]{
  _id,
  _type,
  _updatedAt,
  "slug": select(_type == "home" => null, slug.current),
  "path": select(_type == "home" => "/", "/" + slug.current)
}`);
