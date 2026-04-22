# Next.js + Sanity monorepo

Opinionated boilerplate for a **multi-language, CMS-driven site** built on **Next.js 16 (App Router, React 19)** and **Sanity Studio v5**, with optional **Mux** video and **Netlify** hosting integrations. Designed to stay slim: no unused features, production-grade defaults, and a clear path from `git clone` → first page.

---

## Table of contents

- [Monorepo layout](#monorepo-layout)
- [Feature highlights](#feature-highlights)
- [Requirements](#requirements)
- [Quickstart](#quickstart)
- [Environment & dataset resolution](#environment--dataset-resolution)
- [Core APIs & modules](#core-apis--modules)
- [Scripts reference](#scripts-reference)
- [Tooling](#tooling)
- [Deployment notes](#deployment-notes)
- [Learn more](#learn-more)

---

## Monorepo layout

Managed with **pnpm workspaces** (`pnpm-workspace.yaml`: `web`, `studio`, `packages/*`).

| Package | Path | Role |
|---------|------|------|
| **Web** | `web/` | Next.js 16 App Router app — i18n routing, GROQ data fetching, Portable Text, Mux, sitemap/robots, cache-tag revalidation |
| **Studio** | `studio/` | Sanity Studio v5 — schema, plugins, Presentation (Visual Editing), dev/prod dataset sync |
| **`@repo/sanity-dataset-resolve`** | `packages/sanity-dataset-resolve/` | Shared dev/prod dataset resolution used by **both** web and Studio |
| **`@repo/strip-readmes`** | `packages/strip-readmes/` | Internal utility to bulk-clean documentation during exports |

---

## Feature highlights

### Next.js web app
- **App Router** with nested `[locale]/[slug]` routing, static generation (`generateStaticParams`) and ISR-style revalidation via cache tags.
- **Localization** driven by a Sanity singleton (`siteLanguageSettings`) — no hard-coded locale list. Routing, `<html lang>`, `hreflang` alternates and content fallbacks all derive from Studio.
- **Draft Mode + Visual Editing** wired through `next-sanity` (`SanityLive`, Presentation overlays, stega). `<SanityLive />` only mounts when a read token is present or draft mode is active.
- **Webhook-hardened revalidation** at `POST /api/revalidate` — HMAC-SHA256 signature check (Sanity signed webhooks), payload validation, document-type allowlist, in-memory rate limiter, fail-closed in production.
- **SEO out of the box** — `sitemap.ts` with per-locale `alternates` + `x-default`, staging-aware `robots.ts`, `resolveSanityMetadata` → canonical + `hreflang` metadata for every page.
- **Security headers** via `netlify.toml` — CSP with `frame-ancestors` (Studio-friendly), HSTS preload, `Permissions-Policy`, `Referrer-Policy`. Netlify `build.ignore` skips web builds on Studio-only commits.
- **Tailwind CSS v4** + PostCSS pipeline (`@import`, `calc()`, nested ancestors, custom `rem()` helper). Design tokens live in `web/src/assets/styles/`.

### Media pipeline (Sanity + Mux)
- **`MediaImage`** — native `<img>` with deterministic Sanity CDN URLs, full responsive `srcset`/`sizes`, crop/hotspot-aware `object-position`, LQIP, zero hydration drift. Lazy fade-in via a tiny inline script.
- **`MediaVideo`** — the official Mux React element **`<MuxPlayer />`** imported from `@mux/mux-player-react/lazy` (viewport-deferred JS). Poster image comes from Sanity (hotspot-aware) or Mux's `thumbnail.jpg` sized to the container.
- **`MediaVideoLoop`** — lightweight native `<video>` HLS loop for silent hero/background clips. `hls.js` is imported **only** when the element enters the viewport, respects `prefers-reduced-motion`, and fades the poster off when the first frame decodes.
- **Mux utilities** (`web/src/utils/muxPlayback.ts`): `extractMuxPlaybackId`, `muxHlsSrc` (with `rendition_order=desc`), `muxThumbnailUrl({width})`, `muxThumbnailRequestWidthPx`, `getMuxDisplayDimensions`.

### Sanity Studio
- **Sanity v5** with **Vision**, **Dashboard**, **Presentation** (preview URL configurable per deploy target).
- **`sanity-plugin-internationalized-array`** — language tabs are generated at runtime from `siteLanguageSettings`; no manual language registration.
- **`sanity-plugin-mux-input`** for video uploads + auto-encoding.
- **`sanity-plugin-media`** library, **`@sanity/code-input`**, **`sanity-plugin-netlify`** for deploy-on-publish workflows.
- **Codegen**: `sanity schema extract` + `sanity typegen generate` emit typed GROQ results consumed by `web/sanity/types/`.
- **Dataset sync**: `pnpm studio:sync-prod-to-dev` clones production content into your development dataset safely.

### Internationalization (`web/src/i18n`)
- Config loaded from Sanity at build and request time; a `FALLBACK_SITE_LOCALE_CONFIG` keeps the root layout renderable even before Studio responds.
- Helpers: `createLanguagePathUtils`, `normalizeComparablePathname`, `isCurrentNavHref`, `sanityLocalizedText`.
- Locale-aware navigation (`LanguageSwitch`) with `<option lang="…">` for assistive tech.

### Developer experience
- **Biome** for lint + format (tabs, organized imports, Tailwind-aware CSS).
- **TypeScript** strict across the monorepo, `target: ES2022`.
- **Husky** pre-commit (`lint-staged` — Biome `--write` on staged files) and pre-push (`lint` + `typecheck`).
- **GitHub Actions CI** (`.github/workflows/ci.yml`) — lint, typecheck, build-web, build-studio matrix on Node 20 + 22.
- **Published-only caching** via `web/sanity/cachedSanityQuery.ts` with `unstable_cache` + cache tags (`page`, `sitemap`, `page-slug`, `site-language-settings`) that the revalidate webhook targets.

---

## Requirements

- **Node.js** LTS (20+ recommended; aligned with Next.js 16 / React 19).
- **pnpm** 10 (`packageManager` is pinned in root `package.json`).
- **Sanity project** with a **project id** — you'll need it for both web and Studio.
- **(optional)** Mux API tokens if you want to upload video through the Studio.
- **(optional)** Netlify for hosting — the included `netlify.toml` is production-ready.

---

## Quickstart

```bash
# 1. Clone & install
git clone <your-fork>.git my-site
cd my-site
pnpm install

# 2. Env files
cp web/.env.example     web/.env.local
cp studio/.env.example  studio/.env

# 3. Set SANITY_STUDIO_PROJECT_ID in both files (same project).
#    Everything else has sensible defaults.

# 4. Create a `development` dataset in Sanity (UI or CLI) — optional but
#    recommended so you never edit production while building.
#    Or: pin `SANITY_STUDIO_DATASET=production` to skip dataset splitting.

# 5. Seed Studio — start it and create the `siteLanguageSettings` singleton,
#    add at least one language, mark one as default.
pnpm studio:dev                     # http://localhost:3333

# 6. Run the web app in another terminal
pnpm web:dev                        # http://localhost:3000

# (or run both at once)
pnpm dev
```

### First content

1. In Studio → **Settings → Site languages**, add languages (`id` like `en`, `de`), set `defaultLanguageId`.
2. Create a `page` document with a unique slug per locale.
3. Visit `http://localhost:3000/<locale>/<slug>` — done.

---

## Environment & dataset resolution

### Variables you actually care about

| File | Variable | Required | Purpose |
|------|----------|----------|---------|
| `web/.env.local` + `studio/.env` | `SANITY_STUDIO_PROJECT_ID` | ✅ | Your Sanity project id |
| `web/.env.local` | `SANITY_API_READ_TOKEN` | optional | Draft mode + server-side draft reads |
| `web/.env.local` | `SANITY_REVALIDATE_SECRET` | **prod ✅** | HMAC secret for `/api/revalidate` (fail-closed in prod) |
| `web/.env.local` | `NEXT_PUBLIC_SITE_URL` | ✅ (prod) | Used by `sitemap.ts`, `robots.ts`, metadata base |
| both | `SANITY_STUDIO_DEPLOYMENT_TARGET` | optional | Switch dataset per environment (`staging`, `development`, …) |
| both | `SANITY_STUDIO_DATASET` | optional | **Hard pin** a specific dataset name (skips auto-resolution) |
| `studio/.env` | `SANITY_STUDIO_PREVIEW_ORIGIN` | ✅ (Studio) | Origin used by Presentation iframe |
| `studio/.env` | `SANITY_STUDIO_MUX_TOKEN_ID` / `_SECRET` | optional | Mux uploads in Studio |

Full comments in [`web/.env.example`](web/.env.example) and [`studio/.env.example`](studio/.env.example).

### How `@repo/sanity-dataset-resolve` picks a dataset

1. **Explicit pin** wins: `SANITY_STUDIO_DATASET` / `NEXT_PUBLIC_SANITY_DATASET`.
2. Otherwise, `SANITY_STUDIO_DEPLOYMENT_TARGET` decides order:
   - `production` → prefer `production`, fall back to `development`.
   - `development` / `preview` / unset → prefer `development`, fall back to `production`.
3. Canonical names are configurable (`SANITY_STUDIO_DATASET_DEVELOPMENT` / `_PRODUCTION`).
4. If needed, the resolver can enumerate actual datasets via the Management API (`SANITY_STUDIO_DATASET_RESOLVER_TOKEN` / `SANITY_API_READ_TOKEN`) to avoid requesting a non-existent one.

Used by:
- `web/sanity/resolveStudioDataset.ts` + `web/sanity/sanityEnv.ts`
- `studio/config/sync/studioDataset.ts`

---

## Core APIs & modules

### Web — data access

| Module | Purpose |
|--------|---------|
| `web/sanity/client.ts` | Sanity client (read + draft variants) |
| `web/sanity/fetchSanityData.ts` | Typed GROQ fetchers — the only place that talks to Sanity from React |
| `web/sanity/cachedSanityQuery.ts` | `unstable_cache` wrappers for published-only fetches, tagged for the revalidate webhook |
| `web/sanity/queries/` | GROQ strings, colocated with the components that use them |
| `web/sanity/seo/resolveSanityMetadata.ts` | Builds Next.js `Metadata` with canonical + `hreflang` |
| `web/sanity/live.ts` | `SanityLive` client (only mounted when useful) |

### Web — routing & i18n

| Module | Purpose |
|--------|---------|
| `web/src/app/[locale]/layout.tsx` | Locale layout — injects `LanguageProvider`, navigation chrome |
| `web/src/app/[locale]/page.tsx` / `[slug]/page.tsx` | Home + dynamic pages, use `generateStaticParams` via `cachedPageSlugs()` |
| `web/src/app/sitemap.ts` | Multi-locale sitemap with `alternates` (and `x-default`) |
| `web/src/app/robots.ts` | Staging-aware `robots.txt` |
| `web/src/app/api/revalidate/route.ts` | Signed webhook → `revalidateTag` |
| `web/src/app/api/draft-mode/disable/route.ts` | Safe same-origin redirect after disabling draft mode |
| `web/src/i18n/siteLocalePathUtils.ts` | `createLanguagePathUtils` — prefix/strip locale, compare hrefs |
| `web/src/proxy.ts` | Lightweight proxy to load locale config from the Sanity CDN (middleware) |

### Web — media components

```tsx
import { MediaImage, MediaVideo, MediaVideoLoop } from "@/src/components/media";

<MediaImage imagePayload={image} alt="…" sizes="(max-width: 900px) 100vw, 50vw" />

<MediaVideo media={muxField} posterPayload={poster} videoSettings={{ autoplay: false }} />

{/* Silent background loop — used automatically when videoSettings.autoplay && !controls */}
<MediaVideoLoop media={muxField} posterPayload={poster} fillParent />
```

Each component:
- Measures its container (`useContainerPixelWidth`) and requests exactly the image width the layout needs.
- Handles hydration-safe URLs (deterministic `src`, no `next/image` optimizer).
- Uses `IntersectionObserver` / `@mux/mux-player-react/lazy` for truly lazy loading.

### Studio

| Module | Purpose |
|--------|---------|
| `studio/sanity.config.ts` | Studio root — registers plugins, Presentation, dataset dropdown |
| `studio/schemas/` | Document + object schemas (pages, modules, settings) |
| `studio/config/sync/internationalizedArrayLanguages.ts` | Builds `internationalized-array` languages from `siteLanguageSettings` |
| `studio/config/sync/studioDataset.ts` | Uses `@repo/sanity-dataset-resolve` for the dataset dropdown |
| `studio/scripts/sync-prod-to-dev.mjs` | Safe production → development clone |

---

## Scripts reference

All from the repo root.

| Script | What it does |
|--------|--------------|
| `pnpm dev` | Run `web` + `studio` in parallel |
| `pnpm web:dev` | Web only (`next dev --webpack`) |
| `pnpm studio:dev` | Studio only |
| `pnpm build` | Build all workspaces |
| `pnpm studio:build` / `studio:deploy` | Build / deploy Studio to Sanity hosting |
| `pnpm studio:generate` | Schema extract + GROQ typegen |
| `pnpm studio:sync-prod-to-dev` | Clone `production` → `development` dataset |
| `pnpm lint` | Biome check (repo-wide) |
| `pnpm format` | Biome `--write` (repo-wide) |
| `pnpm typecheck` | Recursive `tsc --noEmit` across workspaces |
| `pnpm update` | `pnpm up -r` for the whole repo |

Per-package: `pnpm --filter <web|studio> run <script>`.

---

## Tooling

- **Biome** — root [`biome.json`](biome.json) is the single source of truth. `web/` and `studio/` call Biome via `pnpm --workspace-root exec biome …`. Studio uses a 2-space override; the rest of the repo is tabs.
- **Husky + lint-staged** — `.husky/pre-commit` runs `lint-staged` (Biome on staged files); `.husky/pre-push` runs `pnpm lint && pnpm typecheck`.
- **GitHub Actions** — `.github/workflows/ci.yml` runs lint + typecheck on Node 20 & 22, plus a `next build` smoke and `sanity build` smoke.
- **TypeScript** — strict, ES2022 target. Root `pnpm typecheck` walks every workspace package's own `typecheck` script.
- **Commit hygiene** — `.DS_Store`, `*.tsbuildinfo`, `coverage/`, `.cursor/` are ignored; see root `.gitignore`.

---

## Deployment notes

### Netlify (web)

`netlify.toml` ships with:
- A **dataset-aware** `build.ignore` — commits that only touch `studio/` don't rebuild the web app.
- **Security headers**: CSP (with `frame-ancestors` allowing `sanity.studio` for Presentation), HSTS preload, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options`.
- Long-lived cache for `/_next/static/*`.

Set on the host:
- `SANITY_STUDIO_PROJECT_ID`, `SANITY_API_READ_TOKEN` (optional), `SANITY_REVALIDATE_SECRET` (required in prod), `NEXT_PUBLIC_SITE_URL`, `SANITY_STUDIO_DEPLOYMENT_TARGET` (if you want to point at a non-production dataset).

### Sanity Studio

- `pnpm studio:deploy` ships to Sanity's hosted Studio (`*.sanity.studio`). The deploy script forces `SANITY_STUDIO_DEPLOYMENT_TARGET=production`.
- Configure the **Revalidate webhook** in Sanity Manage → API → Webhooks, targeting `https://<your-site>/api/revalidate` with the same `SANITY_REVALIDATE_SECRET` (signed delivery).

### Any other host (Vercel, Docker, …)

Everything is standard Next.js + Sanity. Mirror the env vars and you're done. CSP / HSTS live in `netlify.toml` — port the equivalent headers to your platform's config.

---

## Learn more

- [`web/README.md`](web/README.md) — app-level details, module conventions.
- [`web/sanity/README.md`](web/sanity/README.md) — GROQ layer, client config, dataset resolution.
- [`web/src/i18n/README.md`](web/src/i18n/README.md) — localization flow end-to-end.
- [`studio/README.md`](studio/README.md) — Studio customization, plugins, schema patterns.
- [`packages/sanity-dataset-resolve/README.md`](packages/sanity-dataset-resolve/README.md) — resolver API + ordering rules.
