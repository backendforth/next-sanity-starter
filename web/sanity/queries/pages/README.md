# Page queries (`pages/`)

**Full queries** for the routable documents. Each selects one document in the route's language — `home` and `work` by type and `$locale` (`*[_type == "home" && language == $locale][0]`), slug types by `$slug` and `$locale` — and projects `title`, `path` (`routePathProjection`), the content (`modulesQuery`; `project` has a rich-text `body` instead), **`pageSeoQuery`** (the document's own `seo` only) and **`translationsQuery`** (its other language versions, for `hreflang` and the language switch). The site-wide SEO fallback comes with the shell bundle (`fetchSiteChrome(locale).settings`).

## Contents

| File | Export | Selects | Fetcher (`fetchSanityData.ts`) |
|------|--------|---------|--------------------------------|
| `home.ts` | `homeQuery` | `home` in `$locale` | `fetchHomeDocument(locale)` |
| `page.ts` | `pageBySlugQuery` | `page` by `$slug` in `$locale` | `fetchPageBySlug(slug, locale)` |
| `work.ts` | `workQuery` | `work` in `$locale` | `fetchWorkDocument(locale)` |
| `project.ts` | `projectBySlugQuery` | `project` by `$slug` in `$locale` | `fetchProjectBySlug(slug, locale)` |

Slug lists (one row per language version) and the sitemap query live in **`../snippets/sitemap.ts`**; `cachedSanityQuery.ts` reads them (`cachedPageSlugs`, `cachedProjectSlugs`, `cachedSitemapPages`).

## Fetching

Routes don't run these queries themselves: they call the fetcher. It goes through **`sanityFetch`** (Draft Mode, Stega, cache tags), and its primitive arguments let `generateMetadata` and the page share one React `cache` entry per request. Reference: `src/app/[locale]/[slug]/page.tsx`.

## Metadata

Fetch **`fetchSiteChrome(locale)`** alongside the route document (the layout already did, so it is a cache hit) and pass `data` plus `site: chrome?.settings` into **`metadataFromSanityPageData`** from `@/sanity/seo/resolveSanityMetadata`. The helper merges page-level `data.seo` with the site-wide fallback so an empty description or image falls back to **`siteSettings.seo`** in Sanity. The title goes page SEO title → heading → **`segmentFallback`** (the slug); home passes `siteSeoTitleFirst` so the site SEO title comes before its heading. A page titled exactly like the brand skips the layout's `%s | brand` template. `hreflang` alternates come from the document's `translations`, since slugs differ per language.

## Related

- **Components:** `queries/components/` — `modules/` defines what `modules[]` contains; see `queries/components/README.md`.
- **Snippets:** `queries/snippets/` — link, SEO, media, settings, **sitemap / slug lists** (`pageSlugsQuery`, `projectSlugsQuery`, `sitemapPagesQuery`).
