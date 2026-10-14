# Studio utilities

See the [Studio readme](../README.md) for a high-level feature list. Helpers and shared constants used across the Studio package (env, image URLs, slug validation, etc.).

## `constants.ts`

This file **re-exports** **`PAGE_REFERENCES`** from **`schemas/constants/references.ts`** — routable document types for internal links / references. Extend it when you add a new top-level page type that should appear in the link picker.

## Multi-language setup

1. **Languages** — Edit the **`siteLanguageSettings`** singleton (Settings → Site languages) in the Studio. Creating it the first time uses the schema **`initialValue`** (e.g. `en` + `de`, default `en`). If the document is missing or lists no language ids, **`supportedLanguagesFromClient`** falls back to a minimal **`en`** list only — keep that in sync with `web/src/i18n/fallbackSiteLocales.ts`. The **`documentInternationalization`** plugin reads languages via **`config/sync/supportedLanguages.ts`** (`sanity.config.ts`), draft first, so a newly added language is offered for translations before you publish the singleton (reload the Studio to pick it up).

2. **Plugin** — `documentInternationalization` in **`sanity.config.ts`** lists the translatable **document types** in `TRANSLATABLE_SCHEMA_TYPES`. Each of them has a hidden, read-only `language` field (see `schemas/documents/page.ts`); editors create the other language versions from the plugin's language menu in the document header. A new translatable type needs both the field and the list entry. Content fields stay plain (`string`, `richText`, `richTextMedia`).

3. **Frontend** — The Next.js app uses the same language ids as URL segments and selects each document with `language == $locale`.

## Development vs production datasets

Content Lake stores data in **datasets** (e.g. `development`, `production`). This starter resolves which dataset the Studio uses in **`config/sync/studioDataset.ts`**, using **`@repo/sanity-dataset-resolve`**:

- Without **`SANITY_STUDIO_DATASET`**, **local and preview** contexts **prefer** the `development` dataset when it exists; **production deployments** (e.g. Vercel `VERCEL_ENV=production`, Netlify `CONTEXT=production`) **prefer** `production`. Same rules as the web app (not `NODE_ENV`, so local `next start` still prefers `development`).
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
