# Studio configuration

For a **feature overview** (Presentation, datasets, i18n, slugs, Mux), see the [Studio readme](../README.md). For **adding and registering schema types** step by step, see [`schemas/README.md`](../schemas/README.md).

This folder holds **structure** (sidebar), **presentation** (Visual Editing / Web Preview), the singleton roles (**`singletons.ts`**), and **`config/sync/`** (resolved dataset + Studio i18n plugin language fetch). `sanity.config.ts` at the studio root wires these into Sanity.

## Schemas vs structure (not automatic)

- **Schemas** live under `schemas/`. They are registered in **`schemas/index.ts`** via the `schemaTypes` array. Anything exported there is part of the content model and appears in the Schema tab / GraphQL / APIs.
- **Structure** (what editors see in the Desk sidebar) is **separate**. It is defined in `config/structure/index.ts` and **does not** auto-populate from `schemaTypes`. You must add list items, document lists, or singleton links yourself.

So: **new document or object type → add it to `schemas/index.ts`**. **New sidebar entry → add or extend items in `config/structure/`** (see `config/structure/README.md`).

Singletons (fixed document IDs) use `S.document().schemaType("…").documentId("…")` in structure; repeatable types often use `S.documentTypeList("…")`.

## Web Preview (Presentation)

Preview is provided by the **`presentationTool`** in `sanity.config.ts`:

- **`previewUrl.initial`** — base URL of the Next.js app (from `SANITY_STUDIO_PREVIEW_ORIGIN`, default `http://localhost:3000`).
- **`previewMode.enable` / `disable`** — paths that toggle Draft Mode on the frontend (`/api/draft-mode/enable` and `/api/draft-mode/disable` must exist on the site).
- **`resolve.locations`** — `presentationLocationsResolver` in `config/presentation/locationsResolver.ts` maps documents to iframe URLs (which path opens when you use “Web Preview”).
- **`resolve.mainDocuments`** — `presentationMainDocuments` in `config/presentation/resolve.ts` tells Presentation which document type matches which route (e.g. home at `/`, pages at `/:slug`), with or without a `/:locale` prefix.

Shared rules live in `config/presentation/conventions.ts` (`SLUG_BASED_DOCUMENT_TYPES`, `PREFIXED_SLUG_DOCUMENT_TYPES`, …). `SITE_ROOT_DOCUMENT_TYPES` and `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW` are derived from the singleton roles in **`config/singletons.ts`** (`root` / `none`), so a settings singleton that should offer no Web Preview link is declared there. What a new routable type needs: [`schemas/README.md`](../schemas/README.md) §4.

## New schema or singleton

Nothing in this repo auto-registers new types in the sidebar or in Presentation; those steps are intentional so URLs and UX stay explicit. The checklist is in [`AGENTS.md`](../../AGENTS.md) → Cookbook → "Add a document type (page-like)".

## `config/sync/`

- **`studioDataset.ts`** — the Studio's dataset, resolved with **`@repo/sanity-dataset-resolve`** ([root README](../../README.md#datasets)).
- **`internationalizedArrayLanguages.ts`** — runtime languages for `sanity-plugin-internationalized-array`, from `siteLanguageSettings` (see [`utils/README.md`](../utils/README.md)).
