# `web/sanity` — data layer for Sanity + Next.js

This folder holds the **Sanity client**, **GROQ queries**, **TypeScript types** for fetched module shapes, and **utilities** (localization, images, labels). It is designed so pages and components can stay thin: fetch at the route, map types, render.

## Contents

| Path | Role |
|------|------|
| `client.ts` | `createClient` — base client; `defineLive` / `sanityFetch` use it with draft perspective when enabled |
| `live.ts` | `defineLive` → **`sanityFetch`**, **`SanityLive`** — required for Presentation, Draft Mode, and Visual Editing (Stega) |
| `sanityEnv.ts` | Resolved **`projectId`** and **`dataset`** (async fallback when `development` / `production` is missing) |
| `resolveStudioDataset.ts` | Re-exports `resolveStudioDatasetAsync` from **`@repo/sanity-dataset-resolve`**; `getSanityStudioProjectId` for Next |
| `cachedSanityQuery.ts` | **`client.fetch` + `unstable_cache`** — published-only; tags/time revalidation + React `cache` helpers (`cachedHomeDocument`, `cachedPageDocumentBySlug`). Not for routes that need Presentation / Draft Mode |
| `fetchSanityData.ts` | **`sanityFetch`** wrappers: `fetchHomeDocument`, `fetchPageBySlug`, `fetchSiteNavMenus`, `fetchErrorSettings` — use for app routes with preview/VE (pass `{ stega: false }` in `generateMetadata`) |
| `seo/` | `resolveSanityMetadata`, `metadataFromSanityPageData` — route metadata from merged SEO + localized title |
| `queries/` | GROQ: `snippets/`, `components/` (`text/`, `modules/`), `pages/`, plus `queries/index.ts` barrel |
| `types/pages.ts` | `HomeDocument`, `PageDocument`, `PageSeo` — import in **`app/**/page.tsx`** next to route fetches (barrel: `types/index.ts`) |
| `types/modules/` | TS types for `module.*` payloads (and shared image types) |
| `utils/` | Localization (`parseLocalizedText`, `pickLocalizedString`, `pickLocalizedPortableTextBlocks`, …), `sanityImageBuilder`, `getSanityModuleLabel` — see barrel `utils/index.ts` |

Import queries from **`@/sanity/queries`**. Import utilities from **`@/sanity/utils`** (barrel) or **`@/sanity/utils/sanityImageBuilder`** etc.

---

## Translations (`utils/sanityLocalizedText.ts`)

**Which locale the page uses** comes from the URL (`[locale]` route segment). Language ids and order match the Sanity singleton **`siteLanguageSettings`** (`fetchSiteLanguageSettings` in **`fetchSanityData.ts`**). See **`web/README.md`** (*Languages*) and **`web/src/i18n/README.md`**.

Sanity uses **`internationalizedArray*`** fields: arrays of `{ language | _key, value }`.

Use a single entry point:

**`parseLocalizedText({ entries, locale?, as? })`**

- **`entries`** — the array field from your fetched document (e.g. `doc.title`, `module.body`).
- **`locale`** — optional; defaults to `"en"`. Locale tags like `en-US` also try the base language (`en`).
- **`as`** — optional; default **`"auto"`**:
  - **`auto`** — returns a **string** or **Portable Text blocks**, depending on what that field stores; if the requested locale is missing, falls back to another language that has content.
  - **`string`** — returns `string | undefined` (rich-text fields resolve to `undefined`).
  - **`blocks`** — returns `PortableTextBlock[]` (plain-string fields resolve to `[]`).

Example:

```ts
import { parseLocalizedText } from "@/sanity/utils";

const title = parseLocalizedText({ entries: doc.title, locale: "de", as: "string" });
const body = parseLocalizedText({ entries: module.body, locale: "de", as: "blocks" });

// Or let the field shape decide (string vs blocks):
const either = parseLocalizedText({ entries: someField, locale: "de" });
```

For **React** components, prefer **`pickLocalizedString`** and **`pickLocalizedPortableTextBlocks`** (same resolution rules, including nested i18n inside Portable Text). Pass blocks into **`RichTextMedia`** (`src/components/text/RichTextMedia.tsx`) — aligned with schema **`richTextMedia`**.

```ts
import { pickLocalizedString, pickLocalizedPortableTextBlocks } from "@/sanity/utils";

const heading = pickLocalizedString(doc.title, "de");
const blocks = pickLocalizedPortableTextBlocks(module.body, "de");
```

Pass an optional third argument **`siteLocale`** (`{ localeIds, defaultLocale }` from **`fetchSiteLanguageSettings()`**) so fallback order matches **Site languages** in Sanity. **`parseLocalizedText`** accepts **`siteLocale`** in its options object.

---

## Image builder (`utils/sanityImageBuilder.ts`)

Builds optimized CDN URLs from fetched **`image`** fields (`SanityImageField` from `@/sanity/types/modules`) using `@sanity/image-url`, and exposes metadata helpers.

Common exports:

- **`buildFetchedImageUrl(image, { width, height, quality, fit, auto, dpr })`**
- **`urlForFetchedImage(image, width)`** — convenience default (format + quality)
- **`getImageOrientation`**, **`isPortraitImage`**, **`isLandscapeImage`**
- **`getImageAspectRatio`**, **`getImageLqip`**, **`getImageDimensions`**

Example:

```ts
import { buildFetchedImageUrl, getImageOrientation } from "@/sanity/utils";
import type { SanityImageField } from "@/sanity/types/modules";

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
- **Snippets** — reusable GROQ string pieces (`linkQuery`, `pageSeoQuery`, `siteSettingsSeoFallbackQuery`, `settingsBundleQuery`, …). See `queries/snippets/README.md`.
- **Components** — `modulesQuery`, `richTextMediaQuery`, per-module projections. See `queries/components/README.md`.
- **Pages** — `homeQuery`, `pageBySlugQuery`. See `queries/pages/README.md`.
- **Sitemap / slugs** — `pageSlugsQuery`, `sitemapPagesQuery` in `queries/snippets/sitemap.ts`.

Central export: `import { ... } from "@/sanity/queries"`.

---

## Example: page-level fetch with title + modules (Next.js App Router)

This example assumes your page document has i18n `title` and a `modules` array matching `modulesQuery`. Adjust types to your app.

```tsx
// app/[slug]/page.tsx
import { notFound } from "next/navigation";
import { client } from "@/sanity/client";
import { pageBySlugQuery } from "@/sanity/queries";
import { parseLocalizedText, type IntlStringEntry } from "@/sanity/utils";
import type { ContentModule } from "@/sanity/types/modules";

type PageDocument = {
  _id: string;
  title?: IntlStringEntry[] | null;
  modules?: ContentModule[] | null;
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await client.fetch<PageDocument | null>(pageBySlugQuery, { slug });

  if (!doc) {
    notFound();
  }

  const heading = parseLocalizedText({ entries: doc.title, as: "string" }) ?? slug;
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

For production, swap the `<pre>` block for your real module renderer that switches on `mod._type` and narrows with `ContentModule` / specific `ModuleTextData` types.

---

## Environment

See **`web/.env.example`**: copy to **`.env.local`** — project id, optional **`SANITY_STUDIO_DEPLOYMENT_TARGET`** (same name on Studio/host for staging vs prod), preview/VE vars. For custom dataset names (e.g. `staging`), set that target to the dataset name on each deploy environment. Further options (Management API tokens, `SANITY_USE_CDN`, site URL, revalidate) live in **`@repo/sanity-dataset-resolve`** and this README when needed.

### Presentation & Visual Editing (checklist)

Official overview: [Introduction to Visual Editing](https://www.sanity.io/docs/visual-editing/introduction-to-visual-editing) and [Visual editing with Next.js App Router](https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router) (draft mode, Presentation tool, Stega).

1. **`SANITY_API_READ_TOKEN`** (viewer, read) in **`web/.env.local`** — draft-mode enable and `sanityFetch` need it.
2. **`SANITY_STUDIO_PREVIEW_ORIGIN`** — exact Next.js origin loaded in the Presentation iframe (e.g. `http://localhost:3000` or your deploy URL).
3. **`NEXT_PUBLIC_SANITY_STUDIO_URL`** — Studio URL for Stega / click-to-edit overlays (default `http://localhost:3333`).
4. **Studio** — `SANITY_STUDIO_WEB_PREVIEW_ORIGINS` (comma-separated) in `studio/.env` if Presentation runs against a **non-localhost** Next URL; `sanity.config.ts` merges these into `allowOrigins` beside `http://localhost:*`.

Route pages use **`fetchHomeDocument` / `fetchPageBySlug`** so content goes through **`sanityFetch`** (draft + Stega). **`/api/draft-mode/enable`** and **`VisualEditing`** + **`SanityLive`** in the root layout complete the chain.

### Presentation shows “Unable to connect”

1. **`SANITY_API_READ_TOKEN`** must be set in **`web/.env.local`** (restart `pnpm web:dev`). Without it, `/api/draft-mode/enable` responds with **401** and the iframe cannot complete preview.
2. **`SANITY_STUDIO_PREVIEW_ORIGIN`** in **`studio/.env`** must match how you open the site (**`http://localhost:3000`** vs **`http://127.0.0.1:3000`** — pick one and use it everywhere).
3. **Hosted Studio** (HTTPS on sanity.io) cannot load **`http://localhost`** in an iframe (mixed content). Use a tunnel (ngrok, etc.) and set **`SANITY_STUDIO_PREVIEW_ORIGIN`** + **`SANITY_STUDIO_WEB_PREVIEW_ORIGINS`** to that HTTPS URL.
4. In the browser, open **`/api/draft-mode/enable`** with the query string Presentation uses — if you see **Invalid secret**, the token or project id does not match the Studio project.
