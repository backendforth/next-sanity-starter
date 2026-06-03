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

/** Same as {@link pageSlugsQuery} but for `project` documents (`/work/:slug`). */
export const projectSlugsQuery =
	defineQuery(`*[_type == "project" && defined(slug.current)]{
  "slug": slug.current,
  language
}`);

/**
 * All public URL entries for a sitemap across all languages: home + work
 * landing + slug-based `page`/`project` documents. Settings singletons are
 * omitted — they are not public routes.
 *
 * - `path`: URL path from site root, without the locale prefix (the route
 *   layer adds it per `language`).
 * - `language`: the document's locale (one row per language variant).
 *
 * Extend the filter when you add new routable types.
 */
export const sitemapPagesQuery = defineQuery(`*[
  _type == "home" ||
  _type == "work" ||
  (_type == "page" && defined(slug.current)) ||
  (_type == "project" && defined(slug.current))
]{
  _id,
  _type,
  _updatedAt,
  language,
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
