# studio/ — Claude Code subtree rules

Canonical guardrails: @../AGENTS.md. This file only adds Studio-specific gotchas.

## Studio quirks (non-obvious)

- Sanity Studio v5. Biome enforces **2 spaces + double quotes** in `studio/` (overriding the root tabs default).
- `schemas/index.ts` is the gate — any new type is **invisible** to Studio and APIs until exported and added to `schemaTypes`. **YOU MUST** register every new schema there.
- The sidebar does **NOT** auto-populate from `schemaTypes`. New document types need a structure item under `config/structure/items/` and registration in `config/structure/index.ts`.
- `pnpm studio:generate` runs `sanity schema extract` AND `sanity typegen generate`. CI fails if either produces a diff. **Commit** `studio/schema.json` + `studio/sanity.types.gen.ts` in the same commit as the schema change.
- Languages come from the `siteLanguageSettings` singleton at **runtime** (`config/sync/internationalizedArrayLanguages.ts`). Don't hard-code language lists in source.

## Module pattern — Studio half

The 8-step wiring is in @../AGENTS.md. The Studio half (steps 1–4) touches `schemas/objects/modules/`, `schemas/index.ts`, `objects/editors/richTextMedia.ts`, and `fields/modulesArrayField.ts`. **YOU MUST** keep `richTextMedia.ts` and `modulesArrayField.ts` in lockstep — they expose the same module set unless you have a documented reason to differ.

Quickest path: `pnpm gen:module <Name>` from the repo root. See @../packages/scaffold-module/README.md for details.

## Presentation / Web Preview

Routable types need explicit wiring in `config/presentation/`:

- `conventions.ts` — `SLUG_BASED_DOCUMENT_TYPES`, `SITE_ROOT_DOCUMENT_TYPES`, `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW`.
- `resolve.ts` — `presentationMainDocuments` for non-`/:slug` routes.
- `locationsResolver.ts` — custom paths / error pages.

Internal links use `PAGE_REFERENCES` (and `PROJECT_REFERENCES` on `main`) from `schemas/constants/references.ts`.

## Reuse before invention

- `media.image`, `media.video`, `media.videoLoop` already exist in `objects/media/`. **NEVER** redeclare image hotspot fields inline.
- Slug fields use `validateSlug` from `utils/validateSlug.ts`.
- Translatable fields use `internationalizedArrayString` / `internationalizedArrayRichText` / `internationalizedArrayRichTextMedia` — **NEVER** plain `string` for translatable content.

## Anti-patterns specific to studio

- Adding a `module.<id>` to only one of `richTextMedia.ts` / `modulesArrayField.ts`.
- Document type without a structure item — invisible to editors.
- Plain `array` of `string` for translatable content.
- Importing from `web/` — schemas must remain web-agnostic.
