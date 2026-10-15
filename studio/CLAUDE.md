# studio/ — Claude Code subtree rules

Canonical: @../AGENTS.md. Deep docs: [README.md](README.md), [schemas/README.md](schemas/README.md), [config/README.md](config/README.md).

- i18n: document-level — one document per language. Every type in `TRANSLATABLE_SCHEMA_TYPES` (`sanity.config.ts`) has a hidden, read-only `language` field that the plugin sets: never edit, expose or remove it. A new translatable type needs both the field (`languageField`, `schemas/fields/languageField.ts`) and the list entry. Content fields are plain; languages load at runtime from `siteLanguageSettings` (`config/sync/supportedLanguages.ts`).
- i18n: `sanity-plugin-internationalized-array` stays in `package.json` although `studio/` doesn't import it: `@sanity/document-internationalization` requires it as a peer for the `translations` array on `translation.metadata`. Slug fields add `isUniquePerLanguage` (unique per type and language).
- `schemaTypes` alone shows editors nothing: a document type also needs a structure item, a routable one Presentation wiring, a singleton its role in `config/singletons.ts` (AGENTS.md → Cookbook, "Add a document type").
- Every `SANITY_STUDIO_*` variable ends up in the public Studio bundle. Secrets take unprefixed names; `sanity.cli.ts` stops `sanity build` / `sanity deploy` while a `SANITY_STUDIO_*` token, secret or password is set.
- Scripts in `scripts/` run in plain Node and read `studio/.env` through `loadEnvFile.mjs`, not through Vite.
