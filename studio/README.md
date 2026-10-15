# Sanity Studio

This package is the Sanity Studio for the project: schemas, Desk structure, Visual Editing (Presentation), and editor tooling.

## Feature overview

| Feature | What it does | Where to learn more |
|--------|----------------|---------------------|
| **Presentation (Web Preview)** | Embeds the Next.js app in an iframe, Draft Mode, and maps documents to URLs so editors can preview content in context. | `config/README.md`, `config/presentation/` |
| **Multi-dataset** | Resolves which Content Lake dataset the Studio uses (e.g. `development` vs `production`) from env and the datasets that exist in the project, so local work does not have to hit production data. | `@repo/sanity-dataset-resolve`, `config/sync/studioDataset.ts`, `utils/README.md`, `.env.example` |
| **Prod → dev sync** | Optional CLI script exports `production` to a local tarball and imports into `development` (`--replace`). Shown as a hint when you start `pnpm dev` in `studio/`. | `scripts/sync-prod-to-dev.mjs`, below |
| **Multi-language** | **`siteLanguageSettings`** (Settings → Site languages). `sanity-plugin-internationalized-array` loads tabs from Sanity at runtime (`config/sync/internationalizedArrayLanguages.ts`). | `utils/README.md`, root **`README.md`** (*Multilanguage*) |
| **Slug validation** | Shared `validateSlug` helper enforces URL-safe slugs (lowercase, numbers, hyphens) on fields that power frontend routes. | `utils/validateSlug.ts`, used e.g. in `schemas/documents/page.ts` |
| **Mux integration** | `sanity-plugin-mux-input` is registered in `sanity.config.ts`; video fields use the `mux.video` type in schema objects (e.g. media modules). | `sanity.config.ts`, `schemas/objects/modules/moduleMedia.ts` |

Other plugins in this Studio include **structure** (custom sidebar, the start screen), **presentation**, **code input**, **media library**, and **Vision** (GROQ) in development only.

## Documentation map

- **`config/README.md`** — Structure vs schemas, Presentation wiring, dataset module, checklist for new types.
- **`config/structure/README.md`** — How Desk sidebar items are built.
- **`schemas/README.md`** — How to add document/object types and where to register them (including structure).
- **`utils/README.md`** — Constants, page references, datasets, multi-language notes.

## Quick start

1. Copy `studio/.env.example` to `studio/.env` and set `SANITY_STUDIO_PROJECT_ID` (and preview origin if needed). Every `SANITY_STUDIO_*` value ends up in the public Studio bundle, so secrets (`MUX_TOKEN_*`, `SANITY_AUTH_TOKEN`) use plain names; `sanity.cli.ts` stops `sanity build` / `sanity deploy` when a `SANITY_STUDIO_*TOKEN|SECRET|PASSWORD` variable is set.
2. Run `pnpm dev` from the repo root or `pnpm dev` inside `studio/` (shows a **sync hint**; run `sanity dev` directly if you want to skip it).
3. Run `pnpm build` in `studio/` for a production Studio bundle.

## Sync production → development (manual)

`pnpm studio:sync-prod-to-dev` copies the `production` dataset into `development` (`--replace`). It never runs on its own; `pnpm dev` only prints the command. Requirements, flags and what it overwrites: [`scripts/README.md`](scripts/README.md).

## Deploying the Studio

Two targets. **Netlify is the default**: the Studio runs on its own domain (e.g. `studio.your-domain.tld`) as a second Netlify site from this repository. Sanity Hosting (`*.sanity.studio`) stays available as the native alternative.

### Netlify (default)

`netlify.toml` in this folder is the whole pipeline: on every push Netlify installs the workspace, runs `sanity build`, publishes `studio/dist`, and serves every route from `index.html`. Pushes that change nothing in `studio/`, its shared package or the workspace manifests since the last build skip it. Deploy previews prefer the `development` dataset, production prefers `production`; setting `SANITY_STUDIO_DATASET` per deploy context makes that explicit and spares the Studio a dataset probe on every load.

One-time setup:

1. **Netlify site** — import this repository as a new project. Base directory: empty (repo root). **Package directory: `studio`**. Leave build command and publish directory empty; they come from `studio/netlify.toml`.
2. **Environment variables** on that site (see the *Deployment* block in `.env.example`): `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET` (per deploy context: Production `production`, Deploy Previews + Branch deploys `development`), `SANITY_STUDIO_PREVIEW_ORIGIN` (the production web origin), `SANITY_STUDIO_HOSTING_URL`, and as needed `SANITY_STUDIO_WEB_PREVIEW_ORIGINS`, `SANITY_AUTH_TOKEN` and the Mux tokens.
3. **Domain** — add the Studio domain under Domain management.
4. **CORS** — add the same origin in sanity.io/manage → API → CORS origins with **Allow credentials**; without it, login on the custom domain fails. From the CLI: `pnpm --filter studio exec sanity cors add https://studio.your-domain.tld --credentials`.
5. **Web site** — set `NEXT_PUBLIC_SANITY_STUDIO_URL` to the Studio URL and redeploy the web app, so its CSP lets Presentation embed it (`frame-ancestors`) and click-to-edit links open this Studio.
6. **Register** — `pnpm studio:register` lists the URL as the project's Studio in sanity.io/manage and uploads the schema to the schema store, which `sanity deploy` does on its own for Sanity Hosting. Run it once locally (uses your `sanity login`; `--dry-run` to preview), or set `SANITY_AUTH_TOKEN` (a deploy token) on the Netlify site and every production deploy runs it after the build.

### Sanity Hosting (alternative)

To publish the Studio to **Sanity Hosting** (`*.sanity.studio`), run the Sanity CLI **`sanity deploy`**:

- **From this package:** `pnpm deploy` or `pnpm exec sanity deploy` (both run `sanity deploy`).
- **From the monorepo root:** `pnpm studio:deploy` (runs the same deploy in the `studio` workspace).

The CLI will prompt for a hostname on the first deploy and upload the production build. Set **`SANITY_STUDIO_APP_ID`** in `studio/.env` to the app id it prints, and later deploys update that Studio without asking (`sanity.cli.ts` → `deployment.appId`). Ensure production env (dataset, `SANITY_STUDIO_PREVIEW_ORIGIN`, etc.) matches your deployment targets—see `.env.example` and `utils/README.md` for dataset behaviour. Both targets can run side by side; `*.sanity.studio` is always allowed by the web CSP.
