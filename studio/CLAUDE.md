# studio/ — Claude Code subtree rules

> Canonical: [`/AGENTS.md`](../AGENTS.md). This file scopes the Sanity Studio conventions.

## Stack

- Sanity Studio v5.
- Schemas under `schemas/` (`documents/`, `singletons/`, `settings/`, `objects/...`).
- Structure (sidebar) under `config/structure/`; Presentation (Visual Editing) under `config/presentation/`.
- Dataset resolution via `@repo/sanity-dataset-resolve` (`config/sync/studioDataset.ts`). Do not hand-roll dataset switching.
- Biome override: 2-space indentation, double quotes.

## Hard rules

1. **`schemas/index.ts` is the gate.** Any new type is invisible until exported and added to `schemaTypes`.
2. **Module wiring touches three files.** When adding a `module.<id>`: the schema file, `schemas/index.ts`, `objects/editors/richTextMedia.ts`, AND `fields/modulesArrayField.ts`. Then run `pnpm studio:generate`. See `schemas/README.md` §8 for the canonical narrative.
3. **Sidebar is manual.** New document types do NOT appear in the desk until you add an item under `config/structure/items/` and wire it into `config/structure/index.ts`. See `config/structure/README.md`.
4. **Presentation wiring is explicit.** Routable types must be registered in `config/presentation/conventions.ts` (`SLUG_BASED_DOCUMENT_TYPES`, `SITE_ROOT_DOCUMENT_TYPES`, `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW`) and resolved in `resolve.ts` / `locationsResolver.ts`.
5. **i18n at field level.** Translatable fields use `internationalizedArrayString` / `internationalizedArrayRichText` / `internationalizedArrayRichTextMedia` from the plugin — never plain `string` for translatable content. Languages come from the `siteLanguageSettings` singleton via `config/sync/internationalizedArrayLanguages.ts`.
6. **Reuse `media.*` objects.** `media.image`, `media.video`, `media.videoLoop` exist in `objects/media/` — compose them, do not redeclare image/video field shapes.
7. **Slugs use `validateSlug`** from `utils/validateSlug.ts` on every URL-bearing slug field.

## After schema changes (mandatory)

```bash
pnpm studio:generate         # regenerates schema.json + sanity.types.gen.ts
git add studio/schema.json studio/sanity.types.gen.ts
pnpm typecheck
```

CI fails if `studio:generate` produces a diff. Never hand-edit the gen artifacts.

## Adding a new language

Edit the **Site Language Settings** singleton in the running Studio (or via API), not source code:

- Append to `availableLanguages` (order = fallback priority).
- Optionally set `defaultLanguageId`.

Then update `web/src/i18n/fallbackSiteLocales.ts` for offline fallback. No schema, no query, no component change.

## Never edit

- `studio/sanity.types.gen.ts`
- `studio/schema.json`
- Anything under `studio/.sanity/`

## Anti-patterns

- Adding a `module.<id>` only to `richTextMedia.ts` OR only to `modulesArrayField.ts` — they must stay in lockstep.
- Declaring a Document Type without a structure item — invisible to editors.
- Using a plain `array` of `string` for translatable content.
- Importing from `web/` — schema must remain web-agnostic.
