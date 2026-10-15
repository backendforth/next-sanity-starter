# studio/ — Claude Code subtree rules

Canonical: @../AGENTS.md. Deep docs: [README.md](README.md), [schemas/README.md](schemas/README.md), [config/README.md](config/README.md).

- i18n: field-level — translatable fields are `internationalizedArray*`; language tabs load at runtime from `siteLanguageSettings` (`config/sync/internationalizedArrayLanguages.ts`).
- `schemaTypes` alone shows editors nothing: a document type also needs a structure item, a routable one Presentation wiring, a singleton its role in `config/singletons.ts` (AGENTS.md → Cookbook, "Add a document type").
- Every `SANITY_STUDIO_*` variable ends up in the public Studio bundle. Secrets take unprefixed names; `sanity.cli.ts` stops `sanity build` / `sanity deploy` while a `SANITY_STUDIO_*` token, secret or password is set.
- Scripts in `scripts/` run in plain Node and read `studio/.env` through `loadEnvFile.mjs`, not through Vite.
