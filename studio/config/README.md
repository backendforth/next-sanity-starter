# Studio configuration

For a **feature overview** (Presentation, datasets, i18n, slugs, Mux), see the [Studio readme](../README.md). For **adding and registering schema types** step by step, see [`schemas/README.md`](../schemas/README.md).

This folder holds **structure** (sidebar), **presentation** (Visual Editing / Web Preview), **initial value templates**, and **`config/sync/`** (resolved dataset + Studio i18n plugin language fetch). `sanity.config.ts` at the studio root wires these into Sanity.

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
- **`resolve.mainDocuments`** — `presentationMainDocuments` in `config/presentation/resolve.ts` tells Presentation which document type matches which route (e.g. home at `/`, pages at `/:slug`).

Shared rules live in `config/presentation/conventions.ts` (`SLUG_BASED_DOCUMENT_TYPES`, `SITE_ROOT_DOCUMENT_TYPES`, `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW`, etc.). Settings documents that should not offer Web Preview links are listed in **`DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW`**. When you add a **new routable page type** with a slug, extend **`SLUG_BASED_DOCUMENT_TYPES`**, **`PAGE_REFERENCES`** (in `schemas/constants/references.ts`), and usually **structure** + **locations** if the URL pattern is non-standard.

## Checklist: new schema or singleton

| Step | What to do |
|------|------------|
| 1 | Add the schema file and export the type. |
| 2 | Register the type in **`schemas/index.ts`**. |
| 3 | Add a **structure** item (or list) under `config/structure/` and include it in **`config/structure/index.ts`**. |
| 4 | If the doc is linked internally, extend **`PAGE_REFERENCES`** (and link field definitions if needed). |
| 5 | If it should preview on a specific URL, update **`config/presentation/conventions.ts`**, **`resolve.ts`** (`presentationMainDocuments`), and **`locationsResolver.ts`** as needed. |

Nothing in this repo auto-registers new types in the sidebar or in Presentation; those steps are intentional so URLs and UX stay explicit.

## Dataset resolution

`config/sync/studioDataset.ts` wires **`@repo/sanity-dataset-resolve`** so the Studio uses the right dataset (development vs production naming, optional Management API, and dev-first vs prod-first order by deploy context). `config/sync/internationalizedArrayLanguages.ts` supplies runtime languages for `sanity-plugin-internationalized-array`. See `studio/utils/README.md` for editor-facing notes.
