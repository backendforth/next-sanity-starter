# Next.js + Sanity monorepo

Boilerplate for a **localized** marketing/site on **Next.js (App Router)** with **Sanity CMS**, shared **locale config**, and optional **Mux** / **Netlify** integrations in Studio.

## Monorepo layout

| Package | Path | Role |
|--------|------|------|
| **Web** | `web/` | Next.js 16 app, Tailwind v4, Sanity client + GROQ, i18n routing |
| **Studio** | `studio/` | Sanity Studio v5, schema, plugins, dataset sync script |
| **Languages** | `packages/languages/` | **`@repo/languages`** — single source of truth for locales (Next + Studio) |
| **Sanity datasets** | `packages/sanity-dataset-resolve/` | **`@repo/sanity-dataset-resolve`** — shared dev/prod dataset resolution for Studio + Web |

Managed with **pnpm** workspaces (`pnpm-workspace.yaml`: `web`, `studio`, `packages/*`).

## Requirements

- **Node.js** — LTS (e.g. 20+); aligned with Next.js 16 / React 19.
- **pnpm** — install via [pnpm.io](https://pnpm.io/installation).
- **Sanity** — [sanity.io](https://www.sanity.io) project; you need **`SANITY_STUDIO_PROJECT_ID`** (and dataset setup as below).
- **Netlify** — not required for local dev. Studio includes **`sanity-plugin-netlify`** for Netlify-oriented workflows when you wire it in Sanity; deploy targets for **web** are your choice (Vercel, Netlify, etc.) — set env vars on the host to match `web/.env.example`.

## Installation

From the **repository root**:

```bash
pnpm install
```

Copy environment templates:

```bash
cp web/.env.example web/.env.local
cp studio/.env.example studio/.env
```

Fill in at least **`SANITY_STUDIO_PROJECT_ID`** in both (same project). See **Environment & datasets** below.

Run dev servers (also from root):

```bash
pnpm web:dev      # Next.js → http://localhost:3000
pnpm studio:dev   # Sanity Studio (see studio output for URL)
```

Other root scripts: `pnpm build` (all packages), `pnpm studio:build`, `pnpm studio:deploy`, `pnpm studio:generate`, `pnpm studio:sync-prod-to-dev`.

## Environment & datasets

- **Root `.env`** — optional; see root `.env.example`. Locale lists are **not** in env — they live in **`packages/languages/src/index.ts`** (committed).
- **`web/.env.local`** — Next.js: `SANITY_STUDIO_PROJECT_ID` required; optional `NEXT_PUBLIC_*`, dataset overrides, `SANITY_STUDIO_DATASET_RESOLVER_TOKEN` / `SANITY_AUTH_TOKEN` for Management API–based dataset discovery. Full comments in **`web/.env.example`**.
- **`studio/.env`** — Studio: same project id; **`SANITY_STUDIO_PREVIEW_ORIGIN`** (e.g. `http://localhost:3000`) for presentation / preview; optional Mux tokens for **`sanity-plugin-mux-input`**. See **`studio/.env.example`**.

**Dataset resolution** — shared in **`@repo/sanity-dataset-resolve`**; Web uses `web/sanity/resolveStudioDataset.ts` / `sanityEnv.ts`, Studio uses `studio/config/studioDataset.ts`. Explicit `SANITY_STUDIO_DATASET` or `NEXT_PUBLIC_SANITY_DATASET` wins; otherwise **production deployments** prefer the production dataset and **local/preview** prefer **development** when it exists (not `NODE_ENV`). Configurable dataset names via `SANITY_STUDIO_DATASET_DEVELOPMENT` / `SANITY_STUDIO_DATASET_PRODUCTION`, optional Management API / HTTP probe.

**Sync prod → dev dataset** — `pnpm studio:sync-prod-to-dev` (see `studio/scripts` and `.env.example` comments).

## Multilanguage setup

- **Canonical config:** [`packages/languages/src/index.ts`](packages/languages/src/index.ts) — `SITE_LOCALES`, `SITE_DEFAULT_LOCALE`, `SITE_LOCALE_LABELS`, plus exports for **`sanity-plugin-internationalized-array`** (`studioLanguages`, `defaultLanguageIds`).
- **Web** imports via [`web/src/i18n/site-locales.ts`](web/src/i18n/site-locales.ts); **`web/next.config.ts`** sets `transpilePackages: ["@repo/languages"]`.
- **Studio** re-exports from [`studio/schemas/constants/languages.ts`](studio/schemas/constants/languages.ts) so `sanity.config.ts` stays stable.
- **Routing / proxy (i18n) / links:** [`web/src/i18n/README.md`](web/src/i18n/README.md); deeper examples in [`web/README.md`](web/README.md) (*Languages*).

**Add a locale:** edit `packages/languages/src/index.ts`, align Studio content / GROQ, restart web + studio. Do **not** use the default locale’s prefix segment as a page slug (e.g. if default is `en`, paths are unprefixed; other locales use `/de/...`, etc.).

## Stack & feature highlights (packages)

**Web (`web/package.json`)**  
Next.js 16, React 19, **Tailwind CSS v4** (+ PostCSS: import, functions/`rem()`, calc, nested-ancestors), **next-sanity**, **Portable Text** (`@portabletext/react`), **@sanity/image-url**, **clsx** / **tailwind-merge**, **`@repo/languages`**.

**Studio (`studio/package.json`)**  
**Sanity v5**, **Vision**, **Dashboard**, **internationalized-array**, **Media**, **Mux input**, **Netlify plugin**, **Code input**, **`@repo/languages`**. Lint/format via root **Biome** (`pnpm --filter studio run lint`).

**Tooling (Biome)**  
**Root [`biome.json`](biome.json)** is the only Biome config file — there is **no `web/biome.json`** and **no `studio/biome.json`**. **`web/`** and **`studio/`** are linted/formatted via **`pnpm --workspace-root exec biome …`** from each package’s `lint` / `format` scripts, using the root-installed **`@biomejs/biome`**. Studio keeps **2-space indentation** through a root **`overrides`** entry for `studio/**` (the rest of the repo uses **tabs** from the base config).

## Linting & formatting (Biome)

**Root config:** **[`biome.json`](biome.json)** (tabs, double quotes in JS, recommended rules, Tailwind-aware CSS parser, VCS/git ignore). Running Biome from the repo root with no path uses the default project scope — **`web/`** is included unless you exclude it in `biome.json`.

From the **repository root**, after `pnpm install` (Biome is a root `devDependency`):

| Task | Command |
|------|---------|
| **Lint (check)** | `pnpm run lint` — `biome check .` |
| **Format + safe fixes** (formatter, import order, …) | `pnpm run format` — **`biome check --write .`** |
| **Formatter only** (no `organizeImports`) | `pnpm exec biome format --write .` |

**Web only:** `pnpm --filter web run lint` / `pnpm --filter web run format` — same root config, paths limited to **`web/`**.

**Studio:** `pnpm --filter studio run lint` / `format` — same root `biome.json`, scoped to **`studio/`** (formatter override: 2 spaces in `studio/**`).

---

More detail: [`web/README.md`](web/README.md), [`web/sanity/README.md`](web/sanity/README.md), [`studio/README.md`](studio/README.md), [`packages/languages/README.md`](packages/languages/README.md).
