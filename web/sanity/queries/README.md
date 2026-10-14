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
| [`snippets/`](./snippets/README.md) | Small fragments: `linkQuery`, `pageSeoQuery`, `imageQuery`, the shell bundle `siteChromeQuery` (nav, cookie banner, site settings, analytics, 404 copy), sitemap helpers. Composed into larger strings, not usually run alone. |
| [`components/`](./components/README.md) | `components/modules/` — `modulesQuery` and per-`module.*` projections; `components/text/richTextMedia.ts` — `richTextMediaQuery` for portable text bodies. |
| [`pages/`](./pages/README.md) | Full document queries: `homeQuery`, `workQuery`, `pageBySlugQuery`, `projectBySlugQuery`. |

**Flow:** `pages/*.ts` and `snippets/settings.ts` **import** snippets and `modulesQuery`, then **interpolate** them into template strings. The exported constants are the **final** GROQ strings your app passes to `client.fetch()` / `sanityFetch`.

## Typed queries (TypeGen)

Every full query is a `defineQuery(...)`; `pnpm generate` writes its result type to `web/sanity/sanity.types.gen.ts`, and `sanityFetch` / `client.fetch` return that type on their own. Three rules keep it working:

1. **Fragments are plain `const` template strings**, built only from other `const` strings. A function call anywhere in the chain (`fragment(name)`, `JSON.stringify(...)`) makes TypeGen skip the query silently; `check:typegen` (part of `pnpm generate`) then fails.
2. **Singletons filter by type too:** `*[_type == "siteSettings" && _id == "siteSettings"][0]`. An `_id` alone gives TypeGen no document type to narrow to.
3. **Name results in `web/sanity/types.ts`**, derived from the generated types (`NonNullable<HomeQueryResult>`, `ModuleOf<"module.x">`). Never hand-write a Sanity-shaped type, never `as` fetched data.

## Parameters

| Query | Parameter | Example |
|-------|-----------|--------|
| `pageBySlugQuery` | `$slug` | Slug string without leading slash, e.g. `"about"`. |

In Vision, open the **Params** JSON editor and set e.g. `{ "slug": "about" }` when using `pageBySlugQuery`.

## Singleton document IDs (Studio)

These match the Desk structure / initial templates:

| ID | Purpose |
|----|--------|
| `home` | Home singleton |
| `siteSettings` | Site metadata, favicon, SEO fallback (part of `siteChromeQuery`), optional modules |
| `siteNav` | Main + footer menus, optional modules |
| `errorSettings` | 404 / 500 copy |
| `siteCookieBanner` | Cookie UI |

---

## Sanity Vision examples

Paste into **Vision** (adjust dataset in Studio if needed). For queries using `$slug`, add params in the Vision UI.

### Home

**Quick existence check:**

```groq
*[_id == "home"][0]{ _id, title }
```

**App route queries** interpolate **`pageSeoQuery`** from [`snippets/seo.ts`](./snippets/seo.ts) (local `seo` only). The site-wide `siteSettings.seo` fallback comes with the shell bundle (`fetchSiteChrome`, already fetched by the layout) and is merged in `metadataFromSanityPageData`. Minimal Vision check:

```groq
*[_id == "home"][0]{
  _id,
  title,
  modules,
  seo {
    title,
    description,
    "imageUrl": image.asset->url
  }
}
```

### Page by slug

**Params (Vision):** `{ "slug": "<slug>" }` — slug only, no leading slash.

Aligned with [`pages/page.ts`](./pages/page.ts) (`pageSeoQuery` + raw `modules`):

```groq
*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  slug,
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
*[_type == "page" && slug.current == $slug][0]{ _id, title, "slug": slug.current }
```

### All page slugs (routing / static paths)

From [`snippets/sitemap.ts`](./snippets/sitemap.ts) — `pageSlugsQuery`:

```groq
*[_type == "page" && defined(slug.current)]{
  "slug": slug.current
}
```

### Sitemap-style list (paths)

From `sitemapPagesQuery`:

```groq
*[_type == "home" || (_type == "page" && defined(slug.current))]{
  _id,
  _type,
  _updatedAt,
  "slug": select(_type == "home" => null, slug.current),
  "path": select(_type == "home" => "/", "/" + slug.current)
}
```

### Navigation (`siteNav`)

The app reads the menus through `siteChromeQuery` in [`snippets/settings.ts`](./snippets/settings.ts) (resolved links, no `modules[]`). **Smoke test** — document and raw menu fields:

```groq
*[_id == "siteNav"][0]{
  _id,
  title,
  mainMenu,
  footerMenu
}
```

To match the app’s resolved links, use the exported `siteChromeQuery` from code (its `nav` expands each menu item with `linkQuery`).

### Site settings

The app reads `siteSettings` through `siteChromeQuery` (`settings`: title, favicon, SEO fallback). Vision smoke test:

```groq
*[_id == "siteSettings"][0]{
  _id,
  title,
  "favicon": favicon{
    crop,
    hotspot,
    "alt": asset->altText,
    "asset": asset->{ _id, url, metadata{ dimensions{ width, height, aspectRatio } } }
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
*[_id == "siteSettings"][0]{ _id, title }
```

### Settings + nav + errors + cookie banner (one object)

Four sub-queries in one GROQ object — a handy Vision smoke test for the shell singletons (the app fetches them together, plus analytics, through `siteChromeQuery`):

```groq
{
  "siteSettings": *[_id == "siteSettings"][0]{ _id, title },
  "siteNav": *[_id == "siteNav"][0]{ _id, title },
  "errorSettings": *[_id == "errorSettings"][0]{ _id, notFoundTitle },
  "siteCookieBanner": *[_id == "siteCookieBanner"][0]{ _id, title, useCookieBanner }
}
```

Extend each branch with the same fields as in [`snippets/settings.ts`](./snippets/settings.ts) when you need parity with production fetches.

---

## Related

- [`snippets/README.md`](./snippets/README.md) — snippet roles and composition patterns  
- [`components/README.md`](./components/README.md) — `modulesQuery` and `richTextMediaQuery`  
- [`pages/README.md`](./pages/README.md) — `homeQuery` / `pageBySlugQuery` usage in Next.js  
- [`../README.md`](../README.md) — `web/sanity` data layer overview  
