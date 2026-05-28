import { defineQuery } from "next-sanity";

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

/**
 * All public URL entries for a sitemap across all languages: slug-based
 * `page` documents plus site-root singletons (e.g. `home`). Settings
 * singletons are omitted — they are not public routes.
 *
 * - `path`: URL path from site root (`/` for home, `/{slug}` for pages),
 *   without the locale prefix (the route layer adds it per `language`).
 * - `language`: the document's locale (one row per language variant).
 *
 * Extend the filter when you add new routable singletons.
 */
export const sitemapPagesQuery =
	defineQuery(`*[_type == "home" || (_type == "page" && defined(slug.current))]{
  _id,
  _type,
  _updatedAt,
  language,
  "slug": select(_type == "home" => null, slug.current),
  "path": select(_type == "home" => "/", "/" + slug.current)
}`);
