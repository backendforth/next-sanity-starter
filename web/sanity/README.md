# `web/sanity` — data layer for Sanity + Next.js

This folder holds the **Sanity client**, the **fetchers**, **GROQ queries**, the **names for their generated types**, and **utilities** (images, links, labels). It is designed so pages and components can stay thin: fetch at the route, render.

## Contents

| Path | Role |
|------|------|
| `client.ts` | `createClient` — the base client. Reads the API CDN in production builds only; `SANITY_USE_CDN=true\|false` overrides that |
| `live.ts` | `defineLive` → **`sanityFetch`**, **`SanityLive`** — required for Presentation, Draft Mode, and Visual Editing (Stega) |
| `sanityEnv.ts` | **`projectId`** and **`dataset`** for every reader (client, proxy, image URLs) — resolved once in `next.config.ts` and inlined into every bundle |
| `fetchSanityData.ts` | **`sanityFetch`** wrappers with primitive arguments only, so `generateMetadata` and the page share one React `cache` entry: `fetchHomeDocument(locale)`, `fetchPageBySlug(slug, locale)`, `fetchWorkDocument(locale)`, `fetchProjectBySlug(slug, locale)` and `fetchSiteChrome(locale)` (nav, cookie banner, site settings, analytics, 404 copy — one query for the whole shell). Each passes `locale` as `$locale`. A render makes two `sanityFetch` calls. Also `fetchSiteLanguageSettings` (routing config) |
| `cachedSanityQuery.ts` | **`client.fetch` + `unstable_cache`** — published-only reads without a request scope: sitemap, `generateStaticParams` slug lists, published language settings. Not for routes that need Presentation / Draft Mode |
| `cacheTags.ts` | The cache tags every read attaches, and the webhook's document type → tags map `/api/revalidate` expires |
| `normalizeSiteLocaleConfig.ts` | `siteLanguageSettings` → `SiteLocaleConfig` (`localeIds`, `defaultLocale`, `languages`); an empty list falls back to `FALLBACK_SITE_LOCALE_CONFIG` |
| `seo/` | `metadataFromSanityPageData` — route metadata from merged SEO + document title, `hreflang` from the document's translations; `siteFaviconIcons` |
| `queries/` | GROQ: `snippets/`, `components/` (`text/`, `modules/`), `pages/`; `queries/index.ts` exports the full queries |
| `sanity.types.gen.ts` | TypeGen output for every `defineQuery` (`pnpm generate`). Never edit |
| `types.ts` | App-facing names derived from it: `ModuleOf<"module.x">`, `RichTextMediaValue`, `NavMenuLink`, `SiteCookieBanner`, `LinkMark`, … — stega-branded, so a literal comparison without `stegaClean` fails `tsc` |
| `utils/` | `sanityImageBuilder`, `dataAttr`, `isStegaVariant` (`stegaVariant.ts`), link helpers (`linkResolver`, `resolveLinkLabel`), `plainText` and the array resolver `sanityLocalizedText` (see below) |

Import full queries from **`@/sanity/queries`**; fragments and utilities from their file (`@/sanity/queries/snippets/media`, `@/sanity/utils/sanityImageBuilder`, …). There is no `utils` barrel.

## Fetching

Components never call `client.fetch`. A route reads its document and the shell through the **`fetchSanityData.ts`** fetchers (`sanityFetch`: Draft Mode, stega, cache tags); the sitemap and `generateStaticParams` read published data through **`cachedSanityQuery.ts`**. A new route type gets its own fetcher there. Reference route: `src/app/[locale]/[slug]/page.tsx`.

---

## Translations (document-level)

**Which locale the page uses** comes from the URL (`[locale]` route segment). Language ids come from the Sanity singleton **`siteLanguageSettings`** (`fetchSiteLanguageSettings` in **`fetchSanityData.ts`**). See **`web/README.md`** (*Languages*) and **`web/src/i18n/README.md`**.

This branch stores one document per language (`@sanity/document-internationalization`). Each translatable document has a `language` field, and its content fields are plain values in that language. So:

- **GROQ selects the language.** Page and settings queries take `$locale` and filter `language == $locale` (e.g. `pageBySlugQuery`, `siteChromeQuery`). The `fetch*` helpers take the route `locale` and pass it through.
- **Components render fields directly.** `doc.title` is a `string`, `module.body` is Portable Text — no locale picking. Pass blocks into **`RichTextMedia`** (`src/components/text/RichTextMedia.tsx`).
- **No cross-language fallback.** If a document doesn't exist in the requested language, the query returns `null`: slug routes (`page`, `project`) 404, while `home` and `work` render a "no document for this locale" notice. The cookie banner and the favicon are the exceptions: they fall back to the default language's document (`siteChromeQuery`).

Plain string fields go through **`plainText(value)`** (`utils/sanityLocalizedText.ts`): trimmed, `undefined` when blank, stega markers kept.

`utils/sanityLocalizedText.ts` also resolves `internationalizedArray*` values (`[{ _key, language, value }]`), `main`'s storage format. Only **`resolveLinkLabel`** needs that: a dataset shared with `main` holds main-shaped documents, and a link can point at one (the `development` dataset's nav links the main-shaped `home`). New code should not need it.

---

## Image builder (`utils/sanityImageBuilder.ts`)

Builds CDN URLs from fetched **`image`** fields with `@sanity/image-url`, honouring crop and hotspot. Its input type `SanityImageField` (exported from the same file) is the shape `imageQuery` projects, checked at runtime by `resolveSanityImageFieldForUrl`.

- **`buildFetchedImageUrl(image, { width, height, quality, fit, auto, format, dpr })`**
- **`getCroppedImageDisplayDimensions`** — pixel size of the cropped area, for `width` / `height` attributes
- **`cssObjectPositionFromSanityImageField`** — hotspot → `object-position`

Image URLs use the same **`projectId`** and **`dataset`** as `client.ts` (both from **`sanityEnv.ts`**). How the dataset is picked: [root README](../../README.md#how-reposanity-dataset-resolve-picks-a-dataset).

---

## Queries

- **Overview** — folder layout, TypeGen rules, singleton ids. See `queries/README.md`.
- **Snippets** — reusable GROQ fragments (`linkQuery`, `pageSeoQuery`, `imageQuery`, `videoQuery`, …) and the shell / sitemap queries. See `queries/snippets/README.md`.
- **Components** — `modulesQuery`, `richTextMediaQuery`, per-module projections. See `queries/components/README.md`.
- **Pages** — `homeQuery`, `workQuery`, `pageBySlugQuery`, `projectBySlugQuery`. See `queries/pages/README.md`.

---

## Environment

Copy **`web/.env.example`** to **`.env.local`**; it describes every variable.

### Presentation & Visual Editing (checklist)

Official overview: [Introduction to Visual Editing](https://www.sanity.io/docs/visual-editing/introduction-to-visual-editing) and [Visual editing with Next.js App Router](https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router) (draft mode, Presentation tool, Stega).

1. **`SANITY_API_READ_TOKEN`** (viewer, read) in **`web/.env.local`** — draft-mode enable and `sanityFetch` need it.
2. **`SANITY_STUDIO_PREVIEW_ORIGIN`** in **`studio/.env`** — exact Next.js origin loaded in the Presentation iframe (e.g. `http://localhost:3000` or your deploy URL).
3. **`NEXT_PUBLIC_SANITY_STUDIO_URL`** — Studio URL for Stega / click-to-edit overlays (default `http://localhost:3333`).
4. **Studio** — `SANITY_STUDIO_WEB_PREVIEW_ORIGINS` (comma-separated) in `studio/.env` if Presentation runs against a **non-localhost** Next URL; `sanity.config.ts` merges these into `allowOrigins` beside `http://localhost:*` and `http://127.0.0.1:*`.

Routes read through the **`fetchSanityData.ts`** fetchers, so content goes through **`sanityFetch`** (draft + Stega). **`/api/draft-mode/enable`** and, in `src/components/layout/DocumentShell.tsx`, **`SanityLive`** plus **`VisualEditing`** (Draft Mode only, via `LazyDraftModeOverlays`) complete the chain.

### Presentation shows “Unable to connect”

1. **`SANITY_API_READ_TOKEN`** must be set in **`web/.env.local`** (restart `pnpm web:dev`). Without it, `/api/draft-mode/enable` responds with **401** and the iframe cannot complete preview.
2. **`SANITY_STUDIO_PREVIEW_ORIGIN`** in **`studio/.env`** must match how you open the site (**`http://localhost:3000`** vs **`http://127.0.0.1:3000`** — pick one and use it everywhere).
3. **Hosted Studio** (HTTPS on sanity.io) cannot load **`http://localhost`** in an iframe (mixed content). Use a tunnel (ngrok, etc.) and set **`SANITY_STUDIO_PREVIEW_ORIGIN`** + **`SANITY_STUDIO_WEB_PREVIEW_ORIGINS`** to that HTTPS URL.
4. In the browser, open **`/api/draft-mode/enable`** with the query string Presentation uses — if you see **Invalid secret**, the token or project id does not match the Studio project.
