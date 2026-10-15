# Sanity Studio

This package is the Sanity Studio for the project: schemas, Desk structure, Visual Editing (Presentation), and editor tooling.

## Feature overview

| Feature | What it does | Where to learn more |
|--------|----------------|---------------------|
| **Presentation (Web Preview)** | Embeds the Next.js app in an iframe, Draft Mode, and maps documents to URLs so editors can preview content in context. | `config/README.md`, `config/presentation/` |
| **Multi-dataset** | Resolves which Content Lake dataset the Studio uses (e.g. `development` vs `production`) from env and the datasets that exist in the project, so local work does not have to hit production data. | `config/sync/studioDataset.ts`; the rules: [root README](../README.md#how-reposanity-dataset-resolve-picks-a-dataset) |
| **Prod → dev sync** | Optional CLI script exports `production` to a local tarball and imports into `development` (`--replace`). Shown as a hint when you start `pnpm dev` in `studio/`. | `scripts/sync-prod-to-dev.mjs`, below |
| **Multi-language** | Document-level: one document per language via **`@sanity/document-internationalization`**. Languages come from **`siteLanguageSettings`** (Settings → Site languages), fetched once per Studio session (`config/sync/supportedLanguages.ts`). Translatable types are the document types with `languageField` (`TRANSLATABLE_SCHEMA_TYPES` in `sanity.config.ts`). | `utils/README.md`, root **`README.md`** (*Two flavours*) |
| **Slug validation** | `validateSlug` enforces URL-safe slugs (lowercase, numbers, hyphens); `validatePageSlug` also rejects slugs the web routes itself or uses as a language prefix. | `utils/validateSlug.ts`; `schemas/README.md` §6 says which one a new type uses |
| **Mux integration** | `sanity-plugin-mux-input` is registered in `sanity.config.ts`; video fields use the `mux.video` type in schema objects (e.g. media modules). | `sanity.config.ts`, `schemas/objects/modules/moduleMedia.ts` |

Other plugins in this Studio include **structure** (custom sidebar, the start screen), **presentation**, **media library**, and **Vision** (GROQ) in development only. `sanity-plugin-internationalized-array` is in `package.json` only as a required peer of `@sanity/document-internationalization` (it backs the `translations` array on `translation.metadata`); no content field uses it.

## Documentation map

- **`config/README.md`** — Structure vs schemas, Presentation wiring, `config/sync/`.
- **`config/structure/README.md`** — How Desk sidebar items are built.
- **`schemas/README.md`** — How to add document/object types and where to register them (including structure).
- **`utils/README.md`** — Multi-language setup, datasets, the helper files in `utils/`.
- **New document type** — the checklist is in [`AGENTS.md`](../AGENTS.md) → Cookbook → "Add a document type (page-like)".

## Quick start

1. Copy `studio/.env.example` to `studio/.env` and set `SANITY_STUDIO_PROJECT_ID` (and preview origin if needed). Every `SANITY_STUDIO_*` value ends up in the public Studio bundle, so secrets (`MUX_TOKEN_*`, `SANITY_AUTH_TOKEN`) use plain names; `sanity.cli.ts` stops `sanity build` / `sanity deploy` when a `SANITY_STUDIO_*TOKEN|SECRET|PASSWORD` variable is set.
2. Run `pnpm dev` from the repo root or `pnpm dev` inside `studio/` (shows a **sync hint**; run `sanity dev` directly if you want to skip it).
3. Run `pnpm build` in `studio/` for a production Studio bundle.

## Sync production → development (manual)

`pnpm studio:sync-prod-to-dev` copies the `production` dataset into `development` (`--replace`). It never runs on its own; `pnpm dev` only prints the command. Requirements, flags and what it overwrites: [`scripts/README.md`](scripts/README.md).

## Deploying the Studio

Netlify on its own domain is the default; Sanity Hosting (`*.sanity.studio`) is the alternative. Both are described step by step in the root README → [Studio on Netlify](../README.md#studio-on-netlify) and [Studio on Sanity Hosting](../README.md#studio-on-sanity-hosting-alternative). The Netlify pipeline itself is [`netlify.toml`](netlify.toml) in this folder.
