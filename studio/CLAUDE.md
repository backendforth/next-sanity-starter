# studio/ — Claude Code subtree rules

Canonical guardrails: @../AGENTS.md. This file only adds Studio-specific gotchas. On this branch (`variant/document-level`), AGENTS.md §"Branch-specific notes" wins over the field-level i18n sections above it.

## Studio quirks (non-obvious)

- Sanity Studio v5. Biome enforces **2 spaces + double quotes** in `studio/` (overriding the root tabs default).
- `schemas/index.ts` is the gate — any new type is **invisible** to Studio and APIs until exported and added to `schemaTypes`. **YOU MUST** register every new schema there.
- The sidebar does **NOT** auto-populate from `schemaTypes`. New document types need a structure item under `config/structure/items/` and registration in `config/structure/index.ts`.
- `pnpm studio:generate` runs `sanity schema extract` AND `sanity typegen generate`. CI fails if either produces a diff. **Commit** `studio/schema.json` + `studio/sanity.types.gen.ts` in the same commit as the schema change.
- Languages come from the `siteLanguageSettings` singleton at **runtime** (`config/sync/supportedLanguages.ts`, fetched once per Studio session for `@sanity/document-internationalization`). Don't hard-code language lists in source.

## Document-level i18n

- One document per language. Every type in `TRANSLATABLE_SCHEMA_TYPES` (`sanity.config.ts`) has a hidden, read-only `language` field that the plugin sets. **NEVER** edit, expose, or remove it.
- A new translatable document type needs both: the `language` field (copy it from `schemas/documents/page.ts`) **and** an entry in `TRANSLATABLE_SCHEMA_TYPES`.
- Content fields are plain (`string`, `richText`, `richTextMedia`). The document's `language` carries the locale.
- `sanity-plugin-internationalized-array` stays in `package.json` although nothing in `studio/` imports it: `@sanity/document-internationalization` requires it as a peer and uses it for the `translations` array on `translation.metadata` documents. Content fields don't use it.

## Module pattern — Studio half

The 8-step wiring is in @../AGENTS.md. The Studio half (steps 1–4) touches `schemas/objects/modules/`, `schemas/index.ts`, `objects/editors/richTextMedia.ts`, and `fields/modulesArrayField.ts`. **YOU MUST** keep `richTextMedia.ts` and `modulesArrayField.ts` in lockstep — they expose the same module set unless you have a documented reason to differ.

Quickest path: `pnpm gen:module <Name>` from the repo root. See @../packages/scaffold-module/README.md for details.

## Presentation / Web Preview

Routable types need explicit wiring in `config/presentation/`:

- `conventions.ts` — `SLUG_BASED_DOCUMENT_TYPES`, `SITE_ROOT_DOCUMENT_TYPES`, `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW`.
- `resolve.ts` — `presentationMainDocuments`: route → document. `/:locale/…` routes match on the document's `language`.
- `locationsResolver.ts` — document → URL, prefixed with the document's `language`; custom paths / error pages.

Internal `link` fields use `PAGE_REFERENCES`; `module.contentRefs` adds `PROJECT_REFERENCES` (both in `schemas/constants/references.ts`).

## Reuse before invention

- `media.image`, `media.video`, `media.videoLoop` already exist in `objects/media/`. **NEVER** redeclare image hotspot fields inline.
- Mux encoding ceilings are set per field (`options.max_resolution_tier` on `mux.video`: video 2160p, loop 1440p). Change the field, not the web playback ceiling — see "Mux video resolution" in @../AGENTS.md.
- Slug fields use `validateSlug` from `utils/validateSlug.ts`, plus `isUniqueLocaleAgnostic` for `options.isUnique` (unique per type and language).

## Anti-patterns specific to studio

- Adding a `module.<id>` to only one of `richTextMedia.ts` / `modulesArrayField.ts`.
- Document type without a structure item — invisible to editors.
- `internationalizedArray*` fields for content — that is `main`'s model, not this branch's.
- A translatable document type without the `language` field or missing from `TRANSLATABLE_SCHEMA_TYPES`.
- Importing from `web/` — schemas must remain web-agnostic.
