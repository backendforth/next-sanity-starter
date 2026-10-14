# `web/sanity` — data layer for Sanity + Next.js

This folder holds the **Sanity client**, **GROQ queries**, the **names for their generated types**, and **utilities** (images, links, labels). It is designed so pages and components can stay thin: fetch at the route, map types, render.

## Contents

| Path | Role |
|------|------|
| `client.ts` | `createClient` — base client; `defineLive` / `sanityFetch` use it with draft perspective when enabled |
| `live.ts` | `defineLive` → **`sanityFetch`**, **`SanityLive`** — required for Presentation, Draft Mode, and Visual Editing (Stega) |
| `sanityEnv.ts` | Resolved **`projectId`** and **`dataset`** (async fallback when `development` / `production` is missing) |
| `resolveStudioDataset.ts` | Re-exports `resolveStudioDatasetAsync` from **`@repo/sanity-dataset-resolve`**; `getSanityStudioProjectId` for Next |
| `cachedSanityQuery.ts` | **`client.fetch` + `unstable_cache`** — published-only reads without a request scope: sitemap, `generateStaticParams` slug lists, published language settings. Not for routes that need Presentation / Draft Mode |
| `fetchSanityData.ts` | **`sanityFetch`** wrappers with primitive arguments only, so `generateMetadata` and the page share one React `cache` entry: `fetchHomeDocument(locale)`, `fetchPageBySlug(slug, locale)`, `fetchWorkDocument(locale)`, `fetchProjectBySlug(slug, locale)`, `fetchSiteChrome(locale)` (nav, cookie banner, site settings, analytics, 404 copy — one query for the whole shell). Each per-language helper passes `locale` as `$locale`. A render makes two `sanityFetch` calls |
| `seo/` | `resolveSanityMetadata`, `metadataFromSanityPageData` — route metadata from merged SEO + document title |
| `queries/` | GROQ: `snippets/`, `components/` (`text/`, `modules/`), `pages/`, plus `queries/index.ts` barrel |
| `sanity.types.gen.ts` | TypeGen output for every `defineQuery` (`pnpm generate`). Never edit |
| `types.ts` | App-facing names derived from it: `ModuleOf<"module.x">`, `RichTextMediaValue`, `NavMenuLink`, `SiteCookieBanner`, `LinkMark`, … — stega-branded, so a literal comparison without `stegaClean` fails `tsc` |
| `utils/` | `sanityImageBuilder`, `getSanityModuleLabel`, `dataAttr`, `isStegaVariant`, link helpers (`linkResolver`, `resolveLinkLabel`), and the array resolver `sanityLocalizedText` (see below) |

Import full queries from **`@/sanity/queries`**, utilities from their file (`@/sanity/utils/sanityImageBuilder`, …).

---

## Translations (document-level)

**Which locale the page uses** comes from the URL (`[locale]` route segment). Language ids come from the Sanity singleton **`siteLanguageSettings`** (`fetchSiteLanguageSettings` in **`fetchSanityData.ts`**). See **`web/README.md`** (*Languages*) and **`web/src/i18n/README.md`**.

This branch stores one document per language (`@sanity/document-internationalization`). Each translatable document has a `language` field, and its content fields are plain values in that language. So:

- **GROQ selects the language.** Page and settings queries take `$locale` and filter `language == $locale` (e.g. `pageBySlugQuery`, `siteChromeQuery`). The `fetch*` helpers take the route `locale` and pass it through.
- **Components render fields directly.** `doc.title` is a `string`, `module.body` is Portable Text — no locale picking. Pass blocks into **`RichTextMedia`** (`src/components/text/RichTextMedia.tsx`) — aligned with schema **`richTextMedia`**.
- **No cross-language fallback.** If a document doesn't exist in the requested language, the query returns `null`: slug routes (`page`, `project`) 404, while `home` and `work` render a "no document for this locale" notice.

`utils/sanityLocalizedText.ts` (`pickLocalizedString`, `pickLocalizedPortableTextBlocks`, `pickLocalizedValue`) resolves `internationalizedArray*` values (`[{ _key, language, value }]`), `main`'s storage format. On this branch only **`resolveLinkLabel`** calls it, so link titles that arrive as arrays still resolve; new code should not need it.

---

## Image builder (`utils/sanityImageBuilder.ts`)

Builds optimized CDN URLs from fetched **`image`** fields using `@sanity/image-url`, and exposes metadata helpers. Its input type `SanityImageField` (exported from the same file) is the shape `imageQuery` projects, checked at runtime by `resolveSanityImageFieldForUrl`.

Common exports:

- **`buildFetchedImageUrl(image, { width, height, quality, fit, auto, dpr })`**
- **`urlForFetchedImage(image, width)`** — convenience default (format + quality)
- **`getImageOrientation`**, **`isPortraitImage`**, **`isLandscapeImage`**
- **`getImageAspectRatio`**, **`getImageDimensions`**

Example:

```ts
import {
  buildFetchedImageUrl,
  getImageOrientation,
  type SanityImageField,
} from "@/sanity/utils/sanityImageBuilder";

function HeroImage({ image }: { image: SanityImageField | null }) {
  if (!image) return null;
  const url =
    buildFetchedImageUrl(image, { width: 1200, auto: "format", quality: 85 }) ?? "";
  const orientation = getImageOrientation(image);
  return <img src={url} alt="" data-orientation={orientation} />;
}
```

Env: image URLs use the same **`projectId`** and **`dataset`** as `client.ts` (from **`sanityEnv.ts`**). Set **`SANITY_STUDIO_DATASET`** if you want a fixed dataset; otherwise **`@repo/sanity-dataset-resolve`** picks dev-first vs prod-first from the deploy context (not `NODE_ENV`); missing `development` or `production` is detected and the other name is used when possible.

---

## Module labels (`utils/sanityModuleLabel.ts`)

**`getSanityModuleLabel(moduleType)`** maps `_type` strings like `module.text` to short UI labels (e.g. placeholders or dev overlays). Import from **`@/sanity/utils`** (same barrel as localization).

---

## Queries

- **Overview** — GROQ basics, folder layout, Sanity Vision examples (home, pages, nav, settings). See `queries/README.md`.
- **Snippets** — reusable GROQ string pieces (`linkQuery`, `pageSeoQuery`, `mediaQuery`, …). See `queries/snippets/README.md`.
- **Components** — `modulesQuery`, `richTextMediaQuery`, per-module projections. See `queries/components/README.md`.
- **Pages** — `homeQuery`, `pageBySlugQuery`. See `queries/pages/README.md`.
- **Sitemap / slugs** — `pageSlugsQuery`, `sitemapPagesQuery` in `queries/snippets/sitemap.ts`.

Central export: `import { ... } from "@/sanity/queries"`.

---

## Example: page-level fetch with title + modules (Next.js App Router)

This example fetches a page in the route's language. `title` is a plain string; `modules` matches `modulesQuery`. Adjust types to your app.

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
  const doc = await client.fetch<PageDocument | null>(pageBySlugQuery, {
    slug,
    locale,
  });

  if (!doc) {
    notFound();
  }

  const heading = doc.title?.trim() || slug;
  const modules = doc.modules ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">{heading}</h1>
      <ul className="mt-8 space-y-6">
        {modules.map((mod, i) => (
          <li key={mod._key ?? i}>
            <pre className="rounded border p-4 text-xs">{mod._type}</pre>
            {/* Replace with real module components (ModuleText, ModuleMedia, …) */}
          </li>
        ))}
      </ul>
    </main>
  );
}
```

For production, use `fetchPageBySlug(slug, locale)` (Draft Mode + Stega) and render `modules` through **`ModulesRenderer`** — see `src/app/[locale]/[slug]/page.tsx`.

---

## Environment

See **`web/.env.example`**: copy to **`.env.local`** — project id, optional **`SANITY_STUDIO_DEPLOYMENT_TARGET`** (same name on Studio/host for staging vs prod), preview/VE vars. For custom dataset names (e.g. `staging`), set that target to the dataset name on each deploy environment. Further options (Management API tokens, `SANITY_USE_CDN`, site URL, revalidate) live in **`@repo/sanity-dataset-resolve`** and this README when needed.

### Presentation & Visual Editing (checklist)

Official overview: [Introduction to Visual Editing](https://www.sanity.io/docs/visual-editing/introduction-to-visual-editing) and [Visual editing with Next.js App Router](https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router) (draft mode, Presentation tool, Stega).

1. **`SANITY_API_READ_TOKEN`** (viewer, read) in **`web/.env.local`** — draft-mode enable and `sanityFetch` need it.
2. **`SANITY_STUDIO_PREVIEW_ORIGIN`** — exact Next.js origin loaded in the Presentation iframe (e.g. `http://localhost:3000` or your deploy URL).
3. **`NEXT_PUBLIC_SANITY_STUDIO_URL`** — Studio URL for Stega / click-to-edit overlays (default `http://localhost:3333`).
4. **Studio** — `SANITY_STUDIO_WEB_PREVIEW_ORIGINS` (comma-separated) in `studio/.env` if Presentation runs against a **non-localhost** Next URL; `sanity.config.ts` merges these into `allowOrigins` beside `http://localhost:*`.

Route pages use **`fetchHomeDocument(locale)` / `fetchPageBySlug(slug, locale)`** so content goes through **`sanityFetch`** (draft + Stega). **`/api/draft-mode/enable`** and **`VisualEditing`** + **`SanityLive`** in the root layout complete the chain.

### Presentation shows “Unable to connect”

1. **`SANITY_API_READ_TOKEN`** must be set in **`web/.env.local`** (restart `pnpm web:dev`). Without it, `/api/draft-mode/enable` responds with **401** and the iframe cannot complete preview.
2. **`SANITY_STUDIO_PREVIEW_ORIGIN`** in **`studio/.env`** must match how you open the site (**`http://localhost:3000`** vs **`http://127.0.0.1:3000`** — pick one and use it everywhere).
3. **Hosted Studio** (HTTPS on sanity.io) cannot load **`http://localhost`** in an iframe (mixed content). Use a tunnel (ngrok, etc.) and set **`SANITY_STUDIO_PREVIEW_ORIGIN`** + **`SANITY_STUDIO_WEB_PREVIEW_ORIGINS`** to that HTTPS URL.
4. In the browser, open **`/api/draft-mode/enable`** with the query string Presentation uses — if you see **Invalid secret**, the token or project id does not match the Studio project.
