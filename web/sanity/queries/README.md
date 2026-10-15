# GROQ queries (`web/sanity/queries/`)

This folder holds the **GROQ** for the Next.js app: reusable **snippets**, **page-level** queries, and **component** projections (`modules[]`, rich text). [`index.ts`](./index.ts) exports the full queries the fetchers use; fragments are imported from their file.

GROQ reference: [sanity.io/docs/groq](https://www.sanity.io/docs/groq). **Vision** in the Studio (development only) runs a query against the Studio's dataset.

## Contents

| Path | Role |
|------|------|
| [`index.ts`](./index.ts) | The full queries (`defineQuery`): page queries, `siteChromeQuery`, `siteLanguageSettingsQuery`, slug and sitemap queries. |
| [`snippets/`](./snippets/README.md) | Fragments: `linkQuery`, `pageSeoQuery`, `imageQuery`, `videoQuery`, `routePathProjection`; plus the shell bundle `siteChromeQuery` (nav, cookie banner, site settings, analytics, 404 copy) and the sitemap queries. |
| [`components/`](./components/README.md) | `components/modules/` — `modulesQuery` and per-`module.*` projections; `components/text/richTextMedia.ts` — `richTextMediaQuery` for portable text bodies. |
| [`pages/`](./pages/README.md) | Full document queries: `homeQuery`, `workQuery`, `pageBySlugQuery`, `projectBySlugQuery`. |

**Flow:** fragments are interpolated into the full queries in `pages/` and `snippets/`. Routes run those through the fetchers in [`../fetchSanityData.ts`](../fetchSanityData.ts) (`sanityFetch`); published-only reads go through [`../cachedSanityQuery.ts`](../cachedSanityQuery.ts).

## Typed queries (TypeGen)

Every full query is a `defineQuery(...)`; `pnpm generate` writes its result type to `web/sanity/sanity.types.gen.ts`, and `sanityFetch` returns that type on its own. Three rules keep it working:

1. **Fragments are plain `const` template strings**, built only from other `const` strings. A function call anywhere in the chain (`fragment(name)`, `JSON.stringify(...)`) makes TypeGen skip the query silently; `check:typegen` (part of `pnpm generate`) then fails.
2. **A singleton read by `_id` filters by type too:** `*[_type == "siteLanguageSettings" && _id == "siteLanguageSettings"][0]`. An `_id` alone gives TypeGen no document type to narrow to.
3. **Name results in `web/sanity/types.ts`**, derived from the generated types (`NonNullable<HomeQueryResult>`, `ModuleOf<"module.x">`). Never hand-write a Sanity-shaped type, never `as` fetched data.

## Parameters

| Query | Parameter | Example |
|-------|-----------|--------|
| Every query for a per-language document (pages and the shell, see below) | `$locale` | Language id from `siteLanguageSettings`, e.g. `"en"`. |
| `pageBySlugQuery`, `projectBySlugQuery` | `$slug` | Slug string without leading slash, e.g. `"about"`. |

## Per-language documents

This branch keeps **one document per language** (`@sanity/document-internationalization`). Queries select the document for the route's language by type and `language`, never by `_id`:

| Type | Purpose |
|------|--------|
| `home`, `work` | Home and Work landing pages (`modules[]`) |
| `page`, `project` | Slug routes — `slug.current == $slug && language == $locale` |
| `siteSettings` | Brand title, favicon, SEO fallback (part of `siteChromeQuery`) |
| `siteNav` | Main + footer menus |
| `errorSettings` | 404 copy |
| `siteCookieBanner` | Cookie banner copy |

Pattern: `*[_type == "siteNav" && language == $locale][0]`. The cookie banner falls back to the default language's document, and the favicon always comes from it (see `siteChromeQuery`).

Two global singletons are read by `_id`: **`siteLanguageSettings`** (site languages: routing and the Studio's document languages) and **`siteAnalyticsSettings`** (cookie banner switch, load mode, tracking providers).

## Sanity Vision

The query files interpolate fragments, so copy the expanded string from the code (or log it) when you need the app's exact shape. Two quick checks:

```groq
*[_type == "page" && slug.current == $slug && language == $locale][0]{ _id, title, language, "slug": slug.current }
```

Set the params in Vision, e.g. `{ "slug": "about", "locale": "en" }`.

```groq
*[_type == "siteLanguageSettings" && _id == "siteLanguageSettings"][0]{ availableLanguages, defaultLanguageId }
```

## Related

- [`snippets/README.md`](./snippets/README.md) — fragment roles and composition rules
- [`components/README.md`](./components/README.md) — `modulesQuery` and `richTextMediaQuery`
- [`pages/README.md`](./pages/README.md) — page queries, their fetchers and route metadata
- [`../README.md`](../README.md) — `web/sanity` data layer overview
