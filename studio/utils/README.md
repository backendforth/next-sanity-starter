# Studio utilities

See the [Studio readme](../README.md) for a high-level feature list. Helpers used across the Studio package (image URLs, slug validation, etc.).

## Multi-language setup

1. **Languages** — Edit the **`siteLanguageSettings`** singleton (Settings → Site languages) in the Studio. Creating it the first time uses the schema **`initialValue`** (e.g. `en` + `de`, default `en`). If the document is missing or lists no language ids, **`supportedLanguagesFromClient`** falls back to a minimal **`en`** list only — keep that in sync with `web/src/i18n/fallbackSiteLocales.ts`. The **`documentInternationalization`** plugin reads languages via **`config/sync/supportedLanguages.ts`** (`sanity.config.ts`), draft first, so a newly added language is offered for translations before you publish the singleton (reload the Studio to pick it up).

2. **Plugin** — `documentInternationalization` in **`sanity.config.ts`** lists the translatable **document types** in `TRANSLATABLE_SCHEMA_TYPES`. Each of them has the hidden, read-only `language` field (`languageField`, `schemas/fields/languageField.ts`); editors create the other language versions from the plugin's language menu in the document header. A new translatable type needs both the field and the list entry. Content fields stay plain (`string`, `richText`, `richTextMedia`).

3. **Frontend** — The Next.js app uses the same language ids as URL segments and selects each document with `language == $locale`.

## Development vs production datasets

Content Lake stores data in **datasets** (e.g. `development`, `production`). This starter resolves which dataset the Studio uses in **`config/sync/studioDataset.ts`**, using **`@repo/sanity-dataset-resolve`**:

- Without **`SANITY_STUDIO_DATASET`**, **local and preview** contexts **prefer** the `development` dataset when it exists; **production builds** **prefer** `production` (`studio/netlify.toml` sets `SANITY_STUDIO_DEPLOYMENT_TARGET` per deploy context, so deploy previews prefer `development`).
- If the preferred name does not exist yet, resolution **falls back** to the other name (checked on the public Data API, no token needed).

**Why keep both datasets?**

- **`development`** — safe place to try schema changes, test content, and avoid breaking live content.
- **`production`** — what deployed Studio builds and the live site should use for real content.

You do not “switch” datasets inside the running Studio UI; the **build or dev server** picks the dataset from env + resolution rules. To point Studio at a specific dataset regardless of mode, set **`SANITY_STUDIO_DATASET`** in `.env`.

To **copy content from production into development** on demand (e.g. refresh your dev dataset), use the manual script documented in **`studio/README.md`**: `pnpm run sync:prod-to-dev` inside `studio/` (or `pnpm studio:sync-prod-to-dev` from the repo root).

## Other files (short)

- **`imageUrl.ts`** — `@sanity/image-url` builder for the project id and the resolved **`studioDataset`**.
- **`validateSlug.ts`** — slug format rules (`validatePageSlug` also reserves `work`) and `isUniquePerLanguage`, which lets each language version reuse a slug.
- **`plainLabel.ts`** — a string field's trimmed value or a fallback, for `preview.prepare` labels.
- **`helpers.ts`** — small helpers used by schemas or structure.
