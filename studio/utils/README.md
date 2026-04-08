# Studio utilities

See the [Studio readme](../README.md) for a high-level feature list. Helpers and shared constants used across the Studio package (env, image URLs, slug validation, etc.).

## `constants.ts`

This file **re-exports** two things from the schema layer so utilities and plugins can import a single place:

- **`studioLanguages`** — list of `{ id, title }` objects for each locale (e.g. `en`, `de`). Drives the **`sanity-plugin-internationalized-array`** configuration in `sanity.config.ts` (`languages` and `defaultLanguages`).
- **`defaultLanguageIds`** — which locales are pre-selected when creating localized fields (e.g. `["en"]`).
- **`PAGE_REFERENCES`** — array of `{ type: "…" }` entries for **routable document types** that can be picked in internal links / references. Extend this when you add a new top-level page type that should appear in the link picker.

Source of truth for languages and references remains under **`schemas/constants/`**; `constants.ts` is a convenience barrel.

## Multi-language setup

1. **Languages** — Edit **`schemas/constants/languages.ts`**:
   - Add entries to **`studioLanguages`** (`id` must match what you use in the frontend and in localized fields).
   - Adjust **`defaultLanguageIds`** if new locales should be enabled by default in the array plugin.

2. **Plugin** — `internationalizedArray` in **`sanity.config.ts`** lists which **field types** get the language UI (`string`, `richText`, `richTextMedia`, …). Add new field type names there if you introduce another translatable custom type.

3. **Frontend** — Ensure the Next.js app (or other consumers) uses the same locale ids for routing and content.

Adding a language is **not** automatic end-to-end: update `languages.ts`, then align any GROQ projections, routing, and static paths on the site.

## Development vs production datasets

Content Lake stores data in **datasets** (e.g. `development`, `production`). This starter resolves which dataset the Studio uses in **`config/studioDataset.ts`** (via **`config/resolveStudioDataset.ts`**):

- Without **`SANITY_STUDIO_DATASET`**, local dev (`NODE_ENV=development`) **prefers** a `development` dataset; production builds **prefer** `production`.
- If the preferred name does not exist yet, resolution can **fall back** to the other name (or use the Management API when a token is set — see `studio/.env.example`).

**Why keep both datasets?**

- **`development`** — safe place to try schema changes, test content, and avoid breaking live content.
- **`production`** — what deployed Studio builds and the live site should use for real content.

You do not “switch” datasets inside the running Studio UI; the **build or dev server** picks the dataset from env + resolution rules. To point Studio at a specific dataset regardless of mode, set **`SANITY_STUDIO_DATASET`** in `.env`.

For CI or hosts without a Sanity token, rely on explicit env vars or the default name order documented in **`studio/.env.example`**.

To **copy content from production into development** on demand (e.g. refresh your dev dataset), use the manual script documented in **`studio/README.md`**: `pnpm run sync:prod-to-dev` inside `studio/` (or `pnpm studio:sync-prod-to-dev` from the repo root).

## Other files (short)

- **`env.ts`** — wraps `projectId` and the resolved **`studioDataset`** for image URLs and similar.
- **`imageUrl.ts`** — `@sanity/image-url` builder using `getStudioEnv()`.
- **`validateSlug.ts`**, **`helpers.ts`**, **`defaultCookieSections.ts`** — validation and small helpers as used by schemas or structure.
