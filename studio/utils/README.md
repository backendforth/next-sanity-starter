# Studio utilities

See the [Studio readme](../README.md) for a high-level feature list. Helpers used across the Studio package (image URLs, slug validation, etc.).

## Multi-language setup

1. **Languages** — Edit the **`siteLanguageSettings`** singleton (Settings → Site languages) in the Studio. Creating it the first time uses the schema **`initialValue`** (e.g. `en` + `de`, default `en`). If the document is missing or lists no language ids, **`internationalizedArrayLanguagesFromClient`** falls back to a minimal **`en`** list only — keep that in sync with `web/src/i18n/fallbackSiteLocales.ts`. The **`internationalizedArray`** plugin reads languages live via **`config/sync/internationalizedArrayLanguages.ts`** (`sanity.config.ts`), draft first, so a newly added language gets its tab before you publish the singleton (reload the Studio to pick it up).

2. **Plugin** — `internationalizedArray` in **`sanity.config.ts`** lists which **field types** get the language UI (`string`, `richText`, `richTextMedia`, …). Add new field type names there if you introduce another translatable custom type.

3. **Frontend** — Ensure the Next.js app uses the same locale ids for routing and content.

## Datasets

**`config/sync/studioDataset.ts`** picks the Studio's dataset with **`@repo/sanity-dataset-resolve`** — `development` for local work and previews, `production` for production builds, unless **`SANITY_STUDIO_DATASET`** pins one. The full rules: [root README](../../README.md#how-reposanity-dataset-resolve-picks-a-dataset).

To refresh `development` from `production`: `pnpm studio:sync-prod-to-dev` ([`scripts/README.md`](../scripts/README.md)).

## Other files (short)

- **`imageUrl.ts`** — `@sanity/image-url` builder for the project id and the resolved **`studioDataset`**.
- **`validateSlug.ts`**, **`helpers.ts`** — validation and small helpers as used by schemas or structure.
- **`validateModuleMedia.ts`** — `validateModuleMediaRequired` for an embedded `module.media` (the project's `titleMedia`) and `hasMuxAsset` (a Mux field has an uploaded asset).
- **`titleSlugSource.ts`** — slug `options.source` that uses the first non-empty localized `title` (via **`firstLocalizedLabel.ts`**), so the slug's Generate button works on `internationalizedArrayString` titles.
