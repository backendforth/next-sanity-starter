# GROQ queries (`web/sanity/queries/`)

This folder holds **GROQ** strings for the Next.js app: reusable **snippets**, **page-level** queries, and **component** projections (`modules[]`, rich text). Everything is exported from **`@/sanity/queries`** via [`index.ts`](./index.ts).

## What is GROQ?

**GROQ** (Graph-Relational Object Queries) is Sanity’s query language. You filter and project JSON documents from your Content Lake: filters like `*[_type == "page"]`, projections `{ title, slug }`, joins with `->`, and parameters like `$slug` for dynamic values.

- **Docs:** [sanity.io/docs/groq](https://www.sanity.io/docs/groq)
- **Tooling:** **Vision** in Sanity Studio (Tools → Vision) runs queries against the **current dataset** — use it to validate the examples below.

## Contents

| Path | Role |
|------|------|
| [`index.ts`](./index.ts) | Barrel: re-exports all public query constants. |
| [`snippets/`](./snippets/README.md) | Small fragments: `linkQuery`, `pageSeoQuery`, `imageQuery`, settings singletons (incl. `siteSettingsSeoFallbackQuery`), sitemap helpers. Composed into larger strings, not usually run alone. |
| [`components/`](./components/README.md) | `components/modules/` — `modulesQuery` and per-`module.*` projections; `components/text/richTextMedia.ts` — `richTextMediaQuery` for portable text bodies. |
| [`pages/`](./pages/README.md) | Full document queries: `homeQuery`, `workQuery`, `pageBySlugQuery`, `projectBySlugQuery`. |

**Flow:** `pages/*.ts` and `snippets/settings.ts` **import** snippets and `modulesQuery`, then **interpolate** them into template strings. The exported constants are the **final** GROQ strings your app passes to `client.fetch()`.

## Parameters

| Query | Parameter | Example |
|-------|-----------|--------|
| Every query for a per-language document (pages and settings, see below) | `$locale` | Language id from `siteLanguageSettings`, e.g. `"en"`. |
| `pageBySlugQuery`, `projectBySlugQuery` | `$slug` | Slug string without leading slash, e.g. `"about"`. |

In Vision, open the **Params** JSON editor and set e.g. `{ "slug": "about", "locale": "en" }` when using `pageBySlugQuery`.

## Per-language documents

This branch keeps **one document per language** (`@sanity/document-internationalization`). Queries select the document for the route's language by type and `language`, never by `_id`:

| Type | Purpose |
|------|--------|
| `home` | Home page |
| `work` | Work landing (`/work`) |
| `page`, `project` | Slug routes — `slug.current == $slug && language == $locale` |
| `siteSettings` | Site metadata, favicon, SEO fallback (fetched via `fetchSettingsSeoFallback`), optional modules |
| `siteNav` | Main + footer menus, optional modules |
| `errorSettings` | 404 / 500 copy |
| `siteCookieBanner` | Cookie UI |

Pattern: `*[_type == "siteSettings" && language == $locale][0]`. `siteNav` also falls back to a legacy document without `language` (see `siteNavMenusQuery`).

The only fixed-id document is the global singleton **`siteLanguageSettings`** (`*[_id == "siteLanguageSettings"][0]`).

---

## Sanity Vision examples

Paste into **Vision** (adjust dataset in Studio if needed). Add `$locale` (and `$slug` where used) in the Vision **Params** editor, e.g. `{ "locale": "en" }`.

### Home

**Quick existence check:**

```groq
*[_type == "home" && language == $locale][0]{ _id, title, language }
```

**App route queries** interpolate **`pageSeoQuery`** from [`snippets/seo.ts`](./snippets/seo.ts) (local `seo` only). The site-wide `siteSettings.seo` fallback is fetched separately via **`fetchSettingsSeoFallback`** (one Sanity hit per request) and merged in `metadataFromSanityPageData`. Minimal Vision check:

```groq
*[_type == "home" && language == $locale][0]{
  _id,
  title,
  language,
  modules,
  seo {
    title,
    description,
    "imageUrl": image.asset->url
  }
}
```

### Page by slug

**Params (Vision):** `{ "slug": "<slug>", "locale": "en" }` — slug only, no leading slash.

Aligned with [`pages/page.ts`](./pages/page.ts) (`pageSeoQuery` + raw `modules`):

```groq
*[_type == "page" && slug.current == $slug && language == $locale][0]{
  _id,
  title,
  slug,
  language,
  modules,
  seo {
    title,
    description,
    "imageUrl": image.asset->url
  }
}
```

Minimal:

```groq
*[_type == "page" && slug.current == $slug && language == $locale][0]{ _id, title, "slug": slug.current }
```

### All page slugs (routing / static paths)

From [`snippets/sitemap.ts`](./snippets/sitemap.ts) — `pageSlugsQuery` (all languages; one row per language version):

```groq
*[_type == "page" && defined(slug.current)]{
  "slug": slug.current,
  language
}
```

### Sitemap-style list (paths)

From `sitemapPagesQuery` (simplified — the real query also covers `work` and `project`). `path` has no locale prefix; the sitemap adds it per `language`:

```groq
*[_type == "home" || (_type == "page" && defined(slug.current))]{
  _id,
  _type,
  _updatedAt,
  language,
  "slug": select(_type == "home" => null, slug.current),
  "path": select(_type == "home" => "/", "/" + slug.current)
}
```

### Navigation (`siteNav`)

Full query is `siteNavMenusQuery` in [`snippets/settings.ts`](./snippets/settings.ts) (resolved links, no `modules[]`). **Smoke test** — document and raw menu fields:

```groq
*[_type == "siteNav" && language == $locale][0]{
  _id,
  title,
  language,
  mainMenu,
  footerMenu
}
```

To match the app’s resolved links, use the exported `siteNavMenusQuery` from code (expands each menu item with `linkQuery`).

### Site settings

The app fetches `siteSettings` field-scoped (`siteSettingsTitleQuery`, `siteSettingsFaviconQuery`, `siteSettingsSeoFallbackQuery`). Combined smoke test:

```groq
*[_type == "siteSettings" && language == $locale][0]{
  _id,
  title,
  "favicon": favicon{
    crop,
    hotspot,
    "alt": asset->altText,
    "asset": asset->{ _id, url, metadata{ dimensions{ width, height, aspectRatio }, lqip } }
  },
  seo {
    title,
    description,
    "imageUrl": image.asset->url
  }
}
```

Omit favicon/SEO lines if you only need to verify the document:

```groq
*[_type == "siteSettings" && language == $locale][0]{ _id, title }
```

### Settings + nav + errors + cookie banner (one object)

Four sub-queries in one GROQ object — a handy Vision smoke test for all shell documents of one language at once (the app itself fetches them separately via the `fetch*` helpers):

```groq
{
  "siteSettings": *[_type == "siteSettings" && language == $locale][0]{ _id, title },
  "siteNav": *[_type == "siteNav" && language == $locale][0]{ _id, title },
  "errorSettings": *[_type == "errorSettings" && language == $locale][0]{ _id, notFoundTitle, serverErrorTitle },
  "siteCookieBanner": *[_type == "siteCookieBanner" && language == $locale][0]{ _id, title, useCookieBanner }
}
```

Extend each branch with the same fields as in [`snippets/settings.ts`](./snippets/settings.ts) when you need parity with production fetches.

---

## Related

- [`snippets/README.md`](./snippets/README.md) — snippet roles and composition patterns  
- [`components/README.md`](./components/README.md) — `modulesQuery` and `richTextMediaQuery`  
- [`pages/README.md`](./pages/README.md) — page query usage in Next.js  
- [`../README.md`](../README.md) — `web/sanity` data layer overview  
