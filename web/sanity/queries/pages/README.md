# Page queries (`pages/`)

**End-to-end GROQ strings** for routable (or singleton) documents: they include filters like `*[_type == "home" && _id == "home"][0]` (the `_type` lets TypeGen narrow the result to that document type) or `*[_type == "page" && slug.current == $slug][0]` plus field projections (title, `path`, `modulesQuery`, **`pageSeoQuery`** — local `seo` only). The site-wide SEO fallback comes with the shell bundle (`fetchSiteChrome().settings`) and is passed into `metadataFromSanityPageData`.

Import from `@/sanity/queries`.

## Contents

| File | Export | Description |
|------|--------|-------------|
| `home.ts` | `homeQuery` | Home singleton (`_id == "home"`) |
| `page.ts` | `pageBySlugQuery` | Single page by `slug` param |
| `work.ts` | `workQuery` | Work singleton (`_id == "work"`) |
| `project.ts` | `projectBySlugQuery` | Single project by `slug` param |

Slug lists and sitemap-oriented queries live in **`queries/snippets/sitemap.ts`** (`pageSlugsQuery`, `sitemapPagesQuery`).

## Next.js — single page fetch (App Router)

```tsx
// app/[slug]/page.tsx
import { notFound } from "next/navigation";
import { client } from "@/sanity/client";
import { pageBySlugQuery } from "@/sanity/queries";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Typed by `pnpm generate` — `pageBySlugQuery` is a `defineQuery`. No hand-written type.
  const doc = await client.fetch(pageBySlugQuery, { slug });
  if (!doc) notFound();

  return (
    <main>
      <h1>{/* resolve the i18n title with pickLocalizedString */}</h1>
      {/* render modules */}
    </main>
  );
}
```

## Static generation — `pageSlugsQuery`

Defined in **`snippets/sitemap.ts`**, re-exported from `@/sanity/queries`.

```tsx
import { client } from "@/sanity/client";
import { pageSlugsQuery } from "@/sanity/queries";

export async function generateStaticParams() {
  const rows = await client.fetch(pageSlugsQuery);
  return rows.map(({ slug }) => ({ slug }));
}
```

## Sitemap — `sitemapPagesQuery`

Returns every **public route**: `home` (`path: "/"`), the `work` landing, and every `page` and `project` with a slug. Each row includes `_id`, `_type`, `_updatedAt` and **`path`** (`routePathProjection`) for building `loc`. Use in `app/sitemap.ts` or a Route Handler.

```ts
import { client } from "@/sanity/client";
import { sitemapPagesQuery } from "@/sanity/queries";

const entries = await client.fetch(sitemapPagesQuery);
```

## Home route

```tsx
// app/page.tsx
import { client } from "@/sanity/client";
import { homeQuery } from "@/sanity/queries";

const data = await client.fetch(homeQuery);
```

## Store usage

Page queries return **JSON**. Persist that in your store, not the query string.

**Option A — `sanityFetch` via `fetchSanityData` (recommended for App Router):**

Use **`fetchHomeDocument`** / **`fetchPageBySlug`** from `@/sanity/fetchSanityData` — React `cache` dedupes per request, so `generateMetadata` and the page share one fetch; **`sanityFetch`** respects Draft Mode and Stega for Presentation / Visual Editing. Metadata cleans the strings it uses (`metadataFromSanityPageData`).

```ts
import { fetchPageBySlug } from "@/sanity/fetchSanityData";

// The same call in `generateMetadata` and the page — one fetch per request.
const data = await fetchPageBySlug(slug);
```

**Option A2 — published-only + `unstable_cache`:** the helpers in `@/sanity/cachedSanityQuery` (`cachedSitemapPages`, `cachedPageSlugs`, …) use **`client.fetch`** + tags — fine for tooling that must not use draft perspective; not for Presentation/VE routes.

**Option B — Zustand (client):** fetch via `/api/...` or Server Action, then `set({ page: data })`.

**Option C — TanStack Query:** `queryKey: ["page", slug]`, `queryFn` calls your API that runs `pageBySlugQuery`.

## Metadata

Fetch **`fetchSiteChrome`** alongside the route document (the layout already did, so it is a cache hit) and pass `data` plus `site: chrome?.settings` into **`metadataFromSanityPageData`** from `@/sanity/seo/resolveSanityMetadata`. The helper merges page-level `data.seo` with the site-wide fallback so an empty description or image falls back to **`siteSettings.seo`** in Sanity. The title goes page SEO title → heading → **`segmentFallback`** (the slug); home passes `siteSeoTitleFirst` so the site SEO title comes before its heading. A page titled exactly like the brand skips the layout's `%s | brand` template.

## Related

- **Components:** `queries/components/` — `modules/` defines what `modules[]` contains; see `queries/components/README.md`.
- **Snippets:** `queries/snippets/` — link, SEO, media, settings, **sitemap / slug lists** (`pageSlugsQuery`, `sitemapPagesQuery`).
