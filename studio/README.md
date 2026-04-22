# Sanity Studio

This package is the Sanity Studio for the project: schemas, Desk structure, Visual Editing (Presentation), and editor tooling.

## Feature overview

| Feature | What it does | Where to learn more |
|--------|----------------|---------------------|
| **Presentation (Web Preview)** | Embeds the Next.js app in an iframe, Draft Mode, and maps documents to URLs so editors can preview content in context. | `config/README.md`, `config/presentation/` |
| **Multi-dataset** | Resolves which Content Lake dataset the Studio uses (e.g. `development` vs `production`) from env and optional Management API, so local work does not have to hit production data. | `@repo/sanity-dataset-resolve`, `config/sync/studioDataset.ts`, `utils/README.md`, `.env.example` |
| **Prod → dev sync** | Optional CLI script exports `production` to a local tarball and imports into `development` (`--replace`). Shown as a hint when you start `pnpm dev` in `studio/`. | `scripts/sync-prod-to-dev.mjs`, below |
| **Multi-language** | **`siteLanguageSettings`** (Settings → Site languages). `sanity-plugin-internationalized-array` loads tabs from Sanity at runtime (`config/sync/internationalizedArrayLanguages.ts`). | `utils/README.md`, root **`README.md`** (*Multilanguage*) |
| **Slug validation** | Shared `validateSlug` helper enforces URL-safe slugs (lowercase, numbers, hyphens) on fields that power frontend routes. | `utils/validateSlug.ts`, used e.g. in `schemas/documents/page.ts` |
| **Mux integration** | `sanity-plugin-mux-input` is registered in `sanity.config.ts`; video fields use the `mux.video` type in schema objects (e.g. media modules). | `sanity.config.ts`, `schemas/objects/modules/moduleMedia.ts` |

Other plugins in this Studio include the **dashboard**, **structure** (custom sidebar), **code input**, **media library**, **Netlify**, and optionally **Vision** (GROQ) in development only.

## Documentation map

- **`config/README.md`** — Structure vs schemas, Presentation wiring, dataset module, checklist for new types.
- **`config/structure/README.md`** — How Desk sidebar items are built.
- **`schemas/README.md`** — How to add document/object types and where to register them (including structure).
- **`utils/README.md`** — Constants, page references, datasets, multi-language notes.

## Quick start

1. Copy `studio/.env.example` to `studio/.env` and set `SANITY_STUDIO_PROJECT_ID` (and preview origin if needed).
2. Run `pnpm dev` from the repo root or `pnpm dev` inside `studio/` (shows a **sync hint**; run `sanity dev` directly if you want to skip it).
3. Run `pnpm build` in `studio/` for a production Studio bundle.

## Sync production → development (manual)

When your **development** dataset should match **production** (e.g. after content changes in prod), run explicitly (never automatic):

- **From `studio/`:** `pnpm run sync:prod-to-dev`
- **From repo root:** `pnpm studio:sync-prod-to-dev`

Requires **`sanity login`** (or a token Sanity CLI can use) and `SANITY_STUDIO_PROJECT_ID` in `studio/.env`. Dataset names default to `production` and `development`; override with `SANITY_STUDIO_DATASET_PRODUCTION` / `SANITY_STUDIO_DATASET_DEVELOPMENT`.

The script exports prod to `studio/.sync-tmp/prod-to-dev-export.tar.gz`, then imports into the dev dataset with **`--replace`**. Pass `--yes` to skip the confirmation prompt (e.g. CI). The export folder is gitignored.

For a full walkthrough of what the scripts do and why, see **`scripts/README.md`**.

## Deploying hosted Studio

To publish the Studio to **Sanity Hosting** (`*.sanity.studio`), run the Sanity CLI **`sanity deploy`**:

- **From this package:** `pnpm deploy` or `pnpm exec sanity deploy` (both run `sanity deploy`).
- **From the monorepo root:** `pnpm studio:deploy` (runs the same deploy in the `studio` workspace).

The CLI will prompt for a hostname if needed and upload the production build. Ensure production env (dataset, `SANITY_STUDIO_PREVIEW_ORIGIN`, etc.) matches your deployment targets—see `.env.example` and `utils/README.md` for dataset behaviour.
