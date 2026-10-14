# Page queries (`pages/`)

**End-to-end GROQ strings** for routable documents. This branch keeps one document per language, so every query selects by type and `language`: `*[_type == "home" && language == $locale][0]` or `*[_type == "page" && slug.current == $slug && language == $locale][0]`, plus field projections (title, `path`, `modulesQuery`, **`pageSeoQuery`** — local `seo` only). The site-wide SEO fallback comes with the shell bundle (`fetchSiteChrome(locale).settings`) and is passed into `metadataFromSanityPageData`.

Import from `@/sanity/queries`.

## Contents

| File | Export | Description |
|------|--------|-------------|
| `home.ts` | `homeQuery` | Home document for `$locale` |
| `work.ts` | `workQuery` | Work landing for `$locale` |
| `page.ts` | `pageBySlugQuery` | Single page by `$slug` + `$locale` |
| `project.ts` | `projectBySlugQuery` | Single project by `$slug` + `$locale` |

Slug lists and sitemap-oriented queries live in **`queries/snippets/sitemap.ts`** (`pageSlugsQuery`, `projectSlugsQuery`, `sitemapPagesQuery`).

## Next.js — single page fetch (App Router)

```tsx
// app/[locale]/[slug]/page.tsx
import { notFound } from "next/navigation";
import { client } from "@/sanity/client";
import { pageBySlugQuery } from "@/sanity/queries";
import type { PageDocument } from "@/sanity/types/pages";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const doc = await client.fetch<PageDocument | null>(pageBySlugQuery, { slug, locale });
  if (!doc) notFound();

  return (
    <main>
      <h1>{doc.title}</h1>
      {/* render modules */}
    </main>
  );
}
```

## Static generation — `pageSlugsQuery`

Defined in **`snippets/sitemap.ts`**, re-exported from `@/sanity/queries`. Returns one row per language version (`slug` + `language`), so each row maps to one `[locale]/[slug]` pair.

```tsx
import { client } from "@/sanity/client";
import { pageSlugsQuery } from "@/sanity/queries";

export async function generateStaticParams() {
  const rows = await client.fetch<Array<{ slug: string | null; language: string | null }>>(
    pageSlugsQuery,
  );
  return rows
    .filter((r): r is { slug: string; language: string } => Boolean(r.slug && r.language))
    .map((r) => ({ locale: r.language, slug: r.slug }));
}
```

The app's version is `src/app/[locale]/[slug]/page.tsx` (via `cachedPageSlugs`).

## Sitemap — `sitemapPagesQuery`

Returns every **public route** in every language: `home` (`path: "/"`), `work` (`/work`), and all `page` / `project` documents with a slug (`/{slug}`, `/work/{slug}`). Each row includes `_id`, `_type`, `_updatedAt`, `language`, optional `slug`, and **`path`** without the locale prefix — add it per `language` when building `loc` (see `src/app/sitemap.ts`).

```ts
import { client } from "@/sanity/client";
import { sitemapPagesQuery } from "@/sanity/queries";

const entries = await client.fetch<
  Array<{
    _id: string;
    _type: string;
    _updatedAt: string;
    language: string | null;
    slug: string | null;
    path: string;
  }>
>(sitemapPagesQuery);
```

## Home route

```tsx
// app/[locale]/page.tsx
import { client } from "@/sanity/client";
import { homeQuery } from "@/sanity/queries";

const data = await client.fetch(homeQuery, { locale });
```

## Store usage

Page queries return **JSON**. Persist that in your store, not the query string.

**Option A — `sanityFetch` via `fetchSanityData` (recommended for App Router):**

Use **`fetchHomeDocument(locale)`** / **`fetchPageBySlug(slug, locale)`** from `@/sanity/fetchSanityData` — React `cache` dedupes per request, so `generateMetadata` and the page share one fetch; **`sanityFetch`** respects Draft Mode and Stega for Presentation / Visual Editing. Metadata cleans the strings it uses (`resolveSanityMetadata`).

```ts
import { fetchPageBySlug } from "@/sanity/fetchSanityData";

// The same call in `generateMetadata` and the page — one fetch per request.
const data = await fetchPageBySlug(slug, locale);
```

**Option A2 — published-only + `unstable_cache`:** the helpers in `@/sanity/cachedSanityQuery` (`cachedSitemapPages`, `cachedPageSlugs`, …) use **`client.fetch`** + tags — fine for tooling that must not use draft perspective; not for Presentation/VE routes.

**Option B — Zustand (client):** fetch via `/api/...` or Server Action, then `set({ page: data })`.

**Option C — TanStack Query:** `queryKey: ["page", locale, slug]`, `queryFn` calls your API that runs `pageBySlugQuery` with `{ slug, locale }`.

## Metadata

Fetch **`fetchSiteChrome(locale)`** alongside the route document (the layout already did, so it is a cache hit) and pass `data` plus `site: chrome?.settings` into **`metadataFromSanityPageData`** from `@/sanity/seo/resolveSanityMetadata` (or `@/sanity/seo`). The helper merges page-level `data.seo` with the site-wide fallback so an empty description or image falls back to **`siteSettings.seo`** in Sanity. The document's `title` is already in the route's language. The title goes page SEO title → heading → **`segmentFallback`** (the slug or a route label) → site SEO title; home passes `siteSeoTitleFirst` so the site SEO title comes before its heading. A title equal to the brand skips the layout's `%s | brand` template.

## Related

- **Components:** `queries/components/` — `modules/` defines what `modules[]` contains; see `queries/components/README.md`.
- **Snippets:** `queries/snippets/` — link, SEO, media, settings, **sitemap / slug lists** (`pageSlugsQuery`, `projectSlugsQuery`, `sitemapPagesQuery`).
