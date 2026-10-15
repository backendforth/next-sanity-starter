# next-sanity-starter

> A production-shaped starting point for a multi-language, CMS-driven site — **Next.js 16** App Router, **React 19**, **Sanity Studio v6**, with optional **Mux** video and **Netlify** hosting.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![Sanity v6](https://img.shields.io/badge/Sanity-6-f03e2f?logo=sanity&logoColor=white)](https://www.sanity.io)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Biome](https://img.shields.io/badge/Biome-2-60a5fa?logo=biome&logoColor=white)](https://biomejs.dev)
[![License: ISC](https://img.shields.io/badge/license-ISC-green)](LICENSE)

It stays slim on purpose: no unused features, production-grade defaults, and a clear path from `git clone` to first published page. Documentation lives next to the code that needs it.

---

## Two flavours

This starter ships in **two parallel variants** so you can pick the internationalisation model that matches your editorial workflow:

| Branch | i18n strategy | Pick when |
|---|---|---|
| **[`main`](../../tree/main)** | Field-level via `sanity-plugin-internationalized-array` | All translations of one piece of content live in one document with language tabs per field; short, UI-shaped translations. |
| **[`variant/document-level`](../../tree/variant/document-level)** | Document-level via `@sanity/document-internationalization` | Each language is its own document — different slugs, modules, SEO per locale. GROQ does the locale matching; no runtime resolver. |

[**PR #62**](../../pull/62) keeps a permanent side-by-side comparison + decision guide for adopters. Neither branch is a downgrade of the other; both are production-shaped.

---

## What you get

**Next.js app** — App Router with locale-aware routing (`[locale]/[slug]`), `generateStaticParams`, ISR-style revalidation via cache tags, fully wired Sanity Draft Mode + Visual Editing (`SanityLive`, Presentation, stega). Published content stays fresh through the revalidate webhook, or — without one — through `SanityLive` for every visitor (see `web/README.md`, *Freshness*).

**Sanity Studio v6** — Structure, Presentation with configurable preview origin, one document per language (`@sanity/document-internationalization`) with the language list driven by a `siteLanguageSettings` singleton, safe production → development dataset clone. Hosted on Netlify on its own domain by default (`studio/netlify.toml`); Sanity Hosting stays one command away.

**Media pipeline** — Native `<img>` with deterministic Sanity CDN URLs, full responsive `srcset`/`sizes`, hotspot-aware `object-position` and zero hydration drift. Mux video via the official `<MuxPlayer />` imported `/lazy`, plus a lightweight `hls.js` background-loop player that only loads when the element enters the viewport and respects `prefers-reduced-motion`.

**Hardened revalidation** — `POST /api/revalidate` verifies Sanity's webhook signature (`parseBody` from `next-sanity/webhook`), acts only on allow-listed document types, expires the matching cache tags immediately, and is fail-closed in production.

**SEO out of the box** — `sitemap.ts` with per-locale `alternates` and `x-default`, staging-aware `robots.ts`, `metadataFromSanityPageData` builds canonical + `hreflang` metadata for every route.

**Hardened by default** — CSP with `frame-ancestors` (Studio-friendly), HSTS preload, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options` from `headers()` in `web/next.config.ts`, so they reach the SSR HTML on any host. Netlify `build.ignore` skips web builds on Studio-only commits.

**Cookie consent (optional)** — Sanity-driven [`vanilla-cookieconsent`](https://github.com/orestbida/cookieconsent) banner with light/dark theming via `--color-*` tokens, editable copy and per-category sections in JSON, plus `en` / `de` defaults when the doc is empty. An `open-cookie-preferences` link function lets any nav item reopen the preferences modal, and `hasConsent(category)` is exposed for gating analytics scripts. Toggle it on under **Settings → Cookie Banner**; the banner stays inert until `useCookieBanner` is `true`.

**Typed GROQ pipeline** — `sanity typegen` generates result types straight from the schema, gated in CI by a `git diff --exit-code` after every regeneration; `check:typegen` fails when TypeGen skips a query.

**Tailwind CSS v4** — CSS-first config (`@theme`), token-driven dark mode without class hacks, PostCSS pipeline with custom `rem()` helper. Design tokens live in `web/src/assets/styles/`.

---

## Stack at a glance

Managed with **pnpm workspaces** (`pnpm-workspace.yaml`: `web`, `studio`, `packages/*`).

| Package | Path | Role |
|---------|------|------|
| **Web** | `web/` | Next.js 16 App Router app — i18n routing, GROQ data fetching, Portable Text, Mux, sitemap/robots, cache-tag revalidation |
| **Studio** | `studio/` | Sanity Studio v6 — schema, plugins, Presentation, dev/prod dataset sync |
| **`@repo/sanity-dataset-resolve`** | `packages/sanity-dataset-resolve/` | Shared dev/prod dataset resolution used by both web and Studio |
| **`@repo/scaffold-module`** | `packages/scaffold-module/` | `pnpm gen:module <Name>` — scaffolds a new content module and wires it, the `ModulesRenderer.tsx` `case` included |
| **`@repo/check-wiring`** | `packages/check-wiring/` | `pnpm check:wiring` and `check:typegen` — module wiring and query typing (CI gates) |

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

In Studio, open **Settings → Site languages** (pre-filled `en` + `de` on first create, default `en`), publish, then create a `page` with a unique slug. Visit `http://localhost:3000/<locale>/<slug>` — done.

---

## Environment

Variables you actually care about — full comments live in [`web/.env.example`](web/.env.example) and [`studio/.env.example`](studio/.env.example).

| File | Variable | Required | Purpose |
|------|----------|----------|---------|
| `web/.env.local` + `studio/.env` | `SANITY_STUDIO_PROJECT_ID` | yes | Your Sanity project id |
| `web/.env.local` | `SANITY_API_READ_TOKEN` | optional | Draft mode + server-side draft reads |
| `web/.env.local` | `SANITY_REVALIDATE_SECRET` | **prod yes** | Webhook secret for `/api/revalidate` (fail-closed in prod) |
| `web/.env.local` | `NEXT_PUBLIC_SITE_URL` | yes (prod) | Used by `sitemap.ts`, `robots.ts`, metadata base |
| both | `SANITY_STUDIO_DEPLOYMENT_TARGET` | optional | Switch dataset per environment (`staging`, `development`, …) |
| both | `SANITY_STUDIO_DATASET` | optional | Hard pin a specific dataset name (skips auto-resolution) |
| `studio/.env` | `SANITY_STUDIO_PREVIEW_ORIGIN` | yes (Studio) | Origin used by the Presentation iframe |
| `studio/.env` | `SANITY_STUDIO_HOSTING_URL` | yes (Netlify Studio) | The Studio's own URL — registered with Sanity by `pnpm studio:register` |
| `web/.env.local` | `NEXT_PUBLIC_SANITY_STUDIO_URL` | yes (prod) | Studio URL for CSP `frame-ancestors` and click-to-edit links — same value as `SANITY_STUDIO_HOSTING_URL` |
| Netlify Studio site | `SANITY_AUTH_TOKEN` | optional | Deploy token; production deploys then register the Studio URL and upload the schema |
| `studio/.env` | `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | optional | Mux API token for the one-off `pnpm --filter studio run mux:migrate-assets` (the Mux plugin stores its own credentials) |

**Every `SANITY_STUDIO_*` variable is public**: the Studio build inlines all of them into its JS bundle. Never give a token or secret that prefix — `sanity build` / `sanity deploy` refuse to run with one set.

### How `@repo/sanity-dataset-resolve` picks a dataset

1. **Explicit pin** wins — `SANITY_STUDIO_DATASET` / `NEXT_PUBLIC_SANITY_DATASET`.
2. Otherwise, `SANITY_STUDIO_DEPLOYMENT_TARGET` decides preference order:
   - `production` → prefer `production`, fall back to `development`.
   - `development` / `preview` → prefer `development`, fall back to `production`.
   - unset → `production` first on a Netlify / Vercel production build (`CONTEXT` / `VERCEL_ENV`), `development` first everywhere else.
   - any other value (e.g. `staging`) → that dataset first, then the two above.
3. Canonical names are configurable (`SANITY_STUDIO_DATASET_DEVELOPMENT` / `_PRODUCTION`).
4. Each candidate is probed on the public Data API (no token; 404 = missing), and the first that exists wins. Offline, or with no project id, the first preferred name is used — never a silent switch to production.

Consumed by `web/next.config.ts` (resolved once per build and inlined, so queries and image URLs share it) and `studio/config/sync/studioDataset.ts`.

---

## Architecture in brief

The deep-dive lives in the per-folder READMEs (see [Going deeper](#going-deeper)). The short version:

- **Data access** — `web/sanity/fetchSanityData.ts` is the only place React talks to Sanity; it wraps `sanityFetch` from `defineLive` for Draft Mode / Presentation. Published-only reads (sitemap, `generateStaticParams`, no-token paths) go through `web/sanity/cachedSanityQuery.ts` (`unstable_cache` + cache tags).
- **GROQ** — strings live under `web/sanity/queries/` (snippets, page-level queries, component projections). The final queries are wrapped in `defineQuery` so `sanity typegen` emits result types.
- **i18n** — Sanity's `siteLanguageSettings` singleton drives URL routing, `<html lang>`, `hreflang` alternates, and the Studio's document languages. Each language is its own document; queries select it with `language == $locale`. A minimal `en`-only fallback applies only when the document is missing/invalid (CI, first deploy).
- **Media** — `<MediaImage />`, `<MediaVideo />`, `<MediaVideoLoop />` share container measurement, hydration-safe URLs, and viewport-deferred JS.

---

## Scripts

Every root, `web` and `studio` script is described once, in [`AGENTS.md`](AGENTS.md) → "CLI command reference". Run a package's own script with `pnpm --filter <web|studio> run <script>`.

---

## Tooling

- **Biome** — root [`biome.json`](biome.json) is the single source of truth. `web/` and `studio/` call Biome via `pnpm --workspace-root exec biome …`; Studio uses a 2-space override, the rest of the repo is tabs.
- **Husky** — `.husky/pre-commit` formats the staged files (`biome check --write --staged`) and re-stages them, and refuses a file that also has unstaged changes; `.husky/pre-push` runs `biome ci .` (read-only, fails on any finding) and `pnpm run typecheck`.
- **GitHub Actions** — `.github/workflows/ci.yml` gates every pull request: Biome, `typecheck`, `check:wiring`, `test:tooling`, `pnpm generate` with a diff guard on the committed typegen output, both app builds and the first-load JS budget in `.github/bundle-budget.json`.
- **Dependabot** — grouped dependency updates for both branches; schedule, groups and ignored majors are explained in `.github/dependabot.yml`.
- **TypeScript** — strict, ES2022 target; `web` and `studio` add `noUncheckedIndexedAccess`, `noImplicitOverride` and `noFallthroughCasesInSwitch`. Root `pnpm typecheck` walks every workspace package's own `typecheck` script (the apps and the two tooling packages).
- **Commit hygiene** — `.DS_Store`, `*.tsbuildinfo`, `coverage/`, and editor caches under `.cursor/` are ignored; the committed `.cursor/rules/` folder (Cursor IDE rules) is explicitly re-included. See root `.gitignore`.
- **Agent guardrails** — AI coding assistants (Claude Code, Cursor, Windsurf, Copilot) read [`AGENTS.md`](AGENTS.md) at the repo root. Sub-paths get auto-loaded `CLAUDE.md` files and `.cursor/rules/*.mdc` rules with file-glob scoping. Update `AGENTS.md` first; the others defer to it.

---

## Deploy

### Netlify (web)

`netlify.toml` sets the build command, the Next.js plugin and a path-based `build.ignore`: a push that changed nothing the web app builds from since the last built commit (`web/`, its shared package, the workspace manifests) skips the build.

Security headers (CSP, HSTS, …) are not in `netlify.toml`: they come from `headers()` in `web/next.config.ts`, because Netlify's `[[headers]]` rules never reach the HTML the Next.js function renders. Caching of `/_next/static/*` comes from the Next.js adapter (`@netlify/plugin-nextjs`).

Set on the host: `SANITY_STUDIO_PROJECT_ID`, `SANITY_API_READ_TOKEN` (optional), `SANITY_REVALIDATE_SECRET` (required in prod), `NEXT_PUBLIC_SITE_URL`, `SANITY_STUDIO_DEPLOYMENT_TARGET` (only if you want to point at a non-production dataset).

### Netlify (Studio) — default

The Studio is a second Netlify site from the same repository: package directory `studio`, configured by [`studio/netlify.toml`](studio/netlify.toml) (build, SPA routing, dataset per deploy context, `noindex`, `frame-ancestors` against clickjacking). Commits that only touch the web app don't rebuild it.

Set on that site: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET` (per deploy context: `production` / `development`), `SANITY_STUDIO_PREVIEW_ORIGIN` (production web origin), `SANITY_STUDIO_HOSTING_URL`, optionally `SANITY_AUTH_TOKEN`. Then add the domain to the Sanity project's CORS origins with credentials, set `NEXT_PUBLIC_SANITY_STUDIO_URL` on the web site, and register the Studio (`pnpm studio:register`). Step by step: [`studio/README.md`](studio/README.md#deploying-the-studio).

### Sanity Hosting (Studio) — alternative

`pnpm studio:deploy` ships to Sanity's hosted Studio (`*.sanity.studio`). The deploy script forces `SANITY_STUDIO_DEPLOYMENT_TARGET=production`.

Configure the **Revalidate webhook** in Sanity Manage → API → Webhooks, targeting `https://<your-site>/api/revalidate` with the same `SANITY_REVALIDATE_SECRET` (signed delivery). Projection `{_type, slug}`; the document types it acts on (and which cache tags each one purges) are `WEBHOOK_DOCUMENT_TYPES` in `web/sanity/cacheTags.ts`.

### Any other host (Vercel, Docker, …)

Everything is standard Next.js + Sanity — mirror the env vars and you're done. CSP / HSTS come from `headers()` in `web/next.config.ts` and need no platform config.

---

## Going deeper

- [`web/README.md`](web/README.md) — languages, content freshness, local dev.
- [`web/sanity/README.md`](web/sanity/README.md) — GROQ layer, client config, dataset resolution.
- [`web/src/i18n/README.md`](web/src/i18n/README.md) — localisation flow end-to-end.
- [`studio/README.md`](studio/README.md) — Studio customisation, plugins, schema patterns.
- [`packages/sanity-dataset-resolve/src/index.ts`](packages/sanity-dataset-resolve/src/index.ts) — shared dev/prod resolver, API documented inline.

---

## Requirements

- **Node.js** 22.12 or newer (`engines` in the root `package.json`); CI runs Node 22.
- **pnpm** 10 (pinned in root `package.json` `packageManager`).
- **Sanity project** with a **project id**.
- **(optional)** Mux API tokens for video uploads.
- **(optional)** Netlify for hosting — the included `netlify.toml` is production-ready.

---

## License

[ISC](LICENSE). Use it, fork it, ship it.
