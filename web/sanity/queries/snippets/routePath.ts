/**
 * URL path of a routable document without the locale prefix — `hrefFor` in
 * `src/i18n/siteLocalePathUtils.ts` adds it. `null` for a `page` or `project` without a slug
 * and for any other type, so a link to it renders as plain text; the sitemap and content-refs
 * lists filter on it too. Extend when adding routable types (and the type list in
 * `sitemapPagesQuery`, and `SITE_ROOT_DOCUMENT_TYPES` / `SLUG_BASED_DOCUMENT_TYPES` /
 * `PROJECT_URL_PREFIX` in the Studio's `config/presentation/conventions.ts`).
 */
export const routePathProjection = `select(
  _type == "home" => "/",
  _type == "work" => "/work",
  _type == "project" && defined(slug.current) => "/work/" + slug.current,
  _type == "page" && defined(slug.current) => "/" + slug.current
)`;
