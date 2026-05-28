# next-sanity-boilerplate

> A production-shaped starting point for a multi-language, CMS-driven site — **Next.js 16** App Router, **React 19**, **Sanity Studio v5**, with optional **Mux** video and **Netlify** hosting.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19.2-149eca?logo=react&logoColor=white)](https://react.dev)
[![Sanity v5](https://img.shields.io/badge/Sanity-5.27-f03e2f?logo=sanity&logoColor=white)](https://www.sanity.io)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Biome](https://img.shields.io/badge/Biome-2.4-60a5fa?logo=biome&logoColor=white)](https://biomejs.dev)
[![License: ISC](https://img.shields.io/badge/license-ISC-green)](LICENSE)

It stays slim on purpose: no unused features, production-grade defaults, and a clear path from `git clone` to first published page. Documentation lives next to the code that needs it — strip the per-folder READMEs with `pnpm strip-readmes` once you're ready to ship.

---

## Two flavours

This boilerplate ships in **two parallel variants** so you can pick the internationalisation model that matches your editorial workflow:

| Branch | i18n strategy | Pick when |
|---|---|---|
| **[`main`](../../tree/main)** | Field-level via `sanity-plugin-internationalized-array` | All translations of one piece of content live in one document with language tabs per field; short, UI-shaped translations. |
| **[`variant/document-level`](../../tree/variant/document-level)** ← **you are here** | Document-level via `@sanity/document-internationalization` | Each language is its own document — different slugs, modules, SEO per locale. GROQ does the locale matching; no runtime resolver. |

You're reading the **document-level** branch. [**PR #62**](../../pull/62) keeps a permanent side-by-side comparison + decision guide for adopters. Neither branch is a downgrade of the other; both are production-shaped.

---

## What you get

**Next.js app** — App Router with locale-aware routing (`[locale]/[slug]`), `generateStaticParams`, ISR-style revalidation via cache tags, fully wired Sanity Draft Mode + Visual Editing (`SanityLive`, Presentation, stega). `SanityLive` only mounts when it's actually useful (read token present or draft mode active).

**Sanity Studio v5** — Vision, Dashboard, Presentation with configurable preview origin, a **Translations toolbar** (`@sanity/document-internationalization`) whose supported languages are loaded from the `siteLanguageSettings` singleton, deploy-on-publish via Netlify plugin, safe production → development dataset clone.

**Media pipeline** — Native `<img>` with deterministic Sanity CDN URLs, full responsive `srcset`/`sizes`, hotspot-aware `object-position`, LQIP and zero hydration drift. Mux video via the official `<MuxPlayer />` imported `/lazy`, plus a lightweight `hls.js` background-loop player that only loads when the element enters the viewport and respects `prefers-reduced-motion`.

**Hardened revalidation** — `POST /api/revalidate` does HMAC-SHA256 signature verification (Sanity signed webhooks), payload validation, a document-type allow-list, in-memory rate limiting, and is fail-closed in production.

**SEO out of the box** — `sitemap.ts` with per-locale `alternates` and `x-default`, staging-aware `robots.ts`, `resolveSanityMetadata` builds canonical + `hreflang` metadata for every route.

**Hardened by default** — CSP with `frame-ancestors` (Studio-friendly), HSTS preload, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options` via `netlify.toml`. Netlify `build.ignore` skips web builds on Studio-only commits.

**Typed GROQ pipeline** — `sanity typegen` generates result types straight from the schema, gated in CI by a `git diff --exit-code` after every regeneration. **Full coverage on this branch** — document-level schemas use plain `string` / `richText` fields, so there's no recursive fragment to block the analyser (`main` has hybrid coverage).

**Tailwind CSS v4** — CSS-first config (`@theme`), token-driven dark mode without class hacks, PostCSS pipeline with custom `rem()` helper. Design tokens live in `web/src/assets/styles/`.

---

## Stack at a glance

Managed with **pnpm workspaces** (`pnpm-workspace.yaml`: `web`, `studio`, `packages/*`).

| Package | Path | Role |
|---------|------|------|
| **Web** | `web/` | Next.js 16 App Router app — i18n routing, GROQ data fetching, Portable Text, Mux, sitemap/robots, cache-tag revalidation |
| **Studio** | `studio/` | Sanity Studio v5 — schema, plugins, Presentation, dev/prod dataset sync |
| **`@repo/sanity-dataset-resolve`** | `packages/sanity-dataset-resolve/` | Shared dev/prod dataset resolution used by both web and Studio |
| **`@repo/strip-readmes`** | `packages/strip-readmes/` | Bulk-clean documentation when you ship your fork |

---

## Get started

```bash
git clone <your-fork>.git my-site
cd my-site
pnpm install
```

Copy the env templates and set your project id (the only required variable for local dev):

```bash
cp web/.env.example     web/.env.local
cp studio/.env.example  studio/.env
# Set SANITY_STUDIO_PROJECT_ID in both files (same project). Everything else has sensible defaults.
```

Optional but recommended: create a `development` dataset in Sanity (UI or CLI) so you never edit production while iterating — or pin `SANITY_STUDIO_DATASET=production` to skip dataset splitting.

Start Studio and the web app:

```bash
pnpm dev               # both in parallel
# or:
pnpm studio:dev        # Studio at http://localhost:3333
pnpm web:dev           # Web at http://localhost:3000
```

In Studio, open **Settings → Site languages** (pre-filled `en` + `de` on first create, default `en`) and publish. Create a `page`, then use the **Translations** toolbar to add language variants — each locale is its own document, and the same slug may exist per locale (`/about` in both `en` and `de`). Visit `http://localhost:3000/<locale>/<slug>` — done.

---

## Environment

Variables you actually care about — full comments live in [`web/.env.example`](web/.env.example) and [`studio/.env.example`](studio/.env.example).

| File | Variable | Required | Purpose |
|------|----------|----------|---------|
| `web/.env.local` + `studio/.env` | `SANITY_STUDIO_PROJECT_ID` | yes | Your Sanity project id |
| `web/.env.local` | `SANITY_API_READ_TOKEN` | optional | Draft mode + server-side draft reads |
| `web/.env.local` | `SANITY_REVALIDATE_SECRET` | **prod yes** | HMAC secret for `/api/revalidate` (fail-closed in prod) |
| `web/.env.local` | `NEXT_PUBLIC_SITE_URL` | yes (prod) | Used by `sitemap.ts`, `robots.ts`, metadata base |
| both | `SANITY_STUDIO_DEPLOYMENT_TARGET` | optional | Switch dataset per environment (`staging`, `development`, …) |
| both | `SANITY_STUDIO_DATASET` | optional | Hard pin a specific dataset name (skips auto-resolution) |
| `studio/.env` | `SANITY_STUDIO_PREVIEW_ORIGIN` | yes (Studio) | Origin used by the Presentation iframe |
| `studio/.env` | `SANITY_STUDIO_MUX_TOKEN_ID` / `_SECRET` | optional | Mux uploads in Studio |

### How `@repo/sanity-dataset-resolve` picks a dataset

1. **Explicit pin** wins — `SANITY_STUDIO_DATASET` / `NEXT_PUBLIC_SANITY_DATASET`.
2. Otherwise, `SANITY_STUDIO_DEPLOYMENT_TARGET` decides preference order:
   - `production` → prefer `production`, fall back to `development`.
   - `development` / `preview` / unset → prefer `development`, fall back to `production`.
3. Canonical names are configurable (`SANITY_STUDIO_DATASET_DEVELOPMENT` / `_PRODUCTION`).
4. If needed, the resolver enumerates actual datasets via the Management API (`SANITY_STUDIO_DATASET_RESOLVER_TOKEN` / `SANITY_API_READ_TOKEN`) to avoid requesting one that doesn't exist.

Consumed by `web/sanity/resolveStudioDataset.ts` + `web/sanity/sanityEnv.ts` and `studio/config/sync/studioDataset.ts`.

---

## Architecture in brief

The deep-dive lives in the per-folder READMEs (see [Going deeper](#going-deeper)). The short version:

- **Data access** — `web/sanity/fetchSanityData.ts` is the only place React talks to Sanity; it wraps `sanityFetch` from `defineLive` for Draft Mode / Presentation. Published-only reads (sitemap, `generateStaticParams`, no-token paths) go through `web/sanity/cachedSanityQuery.ts` (`unstable_cache` + cache tags).
- **GROQ** — strings live under `web/sanity/queries/` (snippets, page-level queries, component projections). Page and home queries filter by `language == $locale`, so the locale match happens in the query rather than in JavaScript. The final queries are wrapped in `defineQuery` so `sanity typegen` emits result types.
- **i18n (document-level)** — each language is its **own document** carrying a hidden `language` field (`@sanity/document-internationalization`); sibling translations are linked by an auto-managed `translation.metadata` document, and editors switch between them via the **Translations** toolbar. The web app filters at the document level (`language == $locale`) and reads plain `string` / Portable Text fields — **no runtime resolver in the hot path**. `siteLanguageSettings` still drives URL routing, `<html lang>`, `hreflang` alternates, and the Studio language list; a minimal `en`-only fallback applies only when that document is missing/invalid (CI, first deploy).
- **Media** — `<MediaImage />`, `<MediaVideo />`, `<MediaVideoLoop />` share container measurement, hydration-safe URLs, and viewport-deferred JS.

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
| `pnpm strip-readmes` | Remove per-folder READMEs when shipping your fork |

Per-package: `pnpm --filter <web|studio> run <script>`.

---

## Tooling

- **Biome** — root [`biome.json`](biome.json) is the single source of truth. `web/` and `studio/` call Biome via `pnpm --workspace-root exec biome …`; Studio uses a 2-space override, the rest of the repo is tabs.
- **Husky** — `.husky/pre-commit` runs `pnpm run format`; `.husky/pre-push` runs `pnpm run format && pnpm run typecheck`.
- **GitHub Actions** — `.github/workflows/ci.yml` runs `pnpm run format` (Biome `check --write`) + a `git diff --exit-code` guard + `pnpm run typecheck` on Node 20 & 22, `pnpm studio:generate` and `pnpm --filter web run generate` with diff guards on the committed typegen artifacts, plus `next build` and `sanity build` smokes.
- **Dependabot** — weekly npm updates, Sanity plugins grouped, `@types/node` major bumps explicitly ignored (typings track Node 22 LTS).
- **TypeScript** — strict, ES2022 target. Root `pnpm typecheck` walks every workspace package's own `typecheck` script.
- **Commit hygiene** — `.DS_Store`, `*.tsbuildinfo`, `coverage/`, `.cursor/` are ignored; see root `.gitignore`.

---

## Deploy

### Netlify (web)

`netlify.toml` ships with:

- A **dataset-aware** `build.ignore` — commits that only touch `studio/` don't rebuild the web app.
- **Security headers** — CSP (with `frame-ancestors` allowing `sanity.studio` for Presentation), HSTS preload, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options`.
- Long-lived cache for `/_next/static/*`.

Set on the host: `SANITY_STUDIO_PROJECT_ID`, `SANITY_API_READ_TOKEN` (optional), `SANITY_REVALIDATE_SECRET` (required in prod), `NEXT_PUBLIC_SITE_URL`, `SANITY_STUDIO_DEPLOYMENT_TARGET` (only if you want to point at a non-production dataset).

### Sanity Studio

`pnpm studio:deploy` ships to Sanity's hosted Studio (`*.sanity.studio`). The deploy script forces `SANITY_STUDIO_DEPLOYMENT_TARGET=production`.

Configure the **Revalidate webhook** in Sanity Manage → API → Webhooks, targeting `https://<your-site>/api/revalidate` with the same `SANITY_REVALIDATE_SECRET` (signed delivery).

### Any other host (Vercel, Docker, …)

Everything is standard Next.js + Sanity — mirror the env vars and you're done. CSP / HSTS live in `netlify.toml`; port the equivalent headers to your platform's config.

---

## Going deeper

- [`web/README.md`](web/README.md) — app-level details, module conventions.
- [`web/sanity/README.md`](web/sanity/README.md) — GROQ layer, client config, dataset resolution.
- [`web/src/i18n/README.md`](web/src/i18n/README.md) — localisation flow end-to-end.
- [`studio/README.md`](studio/README.md) — Studio customisation, plugins, schema patterns.
- [`packages/sanity-dataset-resolve/src/index.ts`](packages/sanity-dataset-resolve/src/index.ts) — shared dev/prod resolver, API documented inline.

---

## Requirements

- **Node.js** LTS — 20 minimum, 22 recommended (CI tests both).
- **pnpm** 10 (pinned in root `package.json` `packageManager`).
- **Sanity project** with a **project id**.
- **(optional)** Mux API tokens for video uploads.
- **(optional)** Netlify for hosting — the included `netlify.toml` is production-ready.

---

## License

[ISC](LICENSE). Use it, fork it, ship it.
