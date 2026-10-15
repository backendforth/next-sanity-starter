# Studio utilities

See the [Studio readme](../README.md) for a high-level feature list. Helpers used across the Studio package (image URLs, slug validation, etc.).

## Multi-language setup

1. **Languages** — Edit the **`siteLanguageSettings`** singleton (Settings → Site languages) in the Studio. Creating it the first time uses the schema **`initialValue`** (e.g. `en` + `de`, default `en`). If the document is missing or lists no language ids, **`supportedLanguagesFromClient`** falls back to a minimal **`en`** list only — the same one the web uses (`@repo/site-languages`). The **`documentInternationalization`** plugin reads languages via **`config/sync/supportedLanguages.ts`** (`sanity.config.ts`), draft first, so a newly added language is offered for translations before you publish the singleton (reload the Studio to pick it up).

2. **Plugin** — `documentInternationalization` in **`sanity.config.ts`** takes the translatable **document types** from `TRANSLATABLE_SCHEMA_TYPES`: every document type with the hidden, read-only `language` field (`languageField`, `schemas/fields/languageField.ts`) in `fields`. Editors create the other language versions from the plugin's language menu in the document header. Adding the field is all a new translatable type needs here. Content fields stay plain (`string`, `richText`, `richTextMedia`).

3. **Frontend** — The Next.js app uses the same language ids as URL segments and selects each document with `language == $locale`.

## Datasets

**`config/sync/studioDataset.ts`** picks the Studio's dataset with **`@repo/sanity-dataset-resolve`** — `development` for local work and previews, `production` for production builds, unless **`SANITY_STUDIO_DATASET`** pins one. The full rules: [root README](../../README.md#how-reposanity-dataset-resolve-picks-a-dataset).

To refresh `development` from `production`: `pnpm studio:sync-prod-to-dev` ([`scripts/README.md`](../scripts/README.md)).

## Other files (short)

- **`imageUrl.ts`** — `@sanity/image-url` builder for the project id and the resolved **`studioDataset`**.
- **`validateSlug.ts`** — slug format rules (`validatePageSlug` also reserves `work`) and `isUniquePerLanguage`, which lets each language version reuse a slug.
- **`onePerLanguage.ts`** — document validation that keeps the per-language singletons at one published document per language.
- **`plainLabel.ts`** — a string field's trimmed value or a fallback, for `preview.prepare` labels.
- **`helpers.ts`** — small helpers used by schemas or structure.
