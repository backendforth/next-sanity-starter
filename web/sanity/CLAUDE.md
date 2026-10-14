# web/sanity/ — Claude Code subtree rules

Canonical: @../../AGENTS.md — on this branch (`variant/document-level`), §"Branch-specific notes" wins over the field-level §i18n. Deep doc: @./README.md and @./queries/README.md.

This is the **data layer**: GROQ queries, hand-maintained TS shapes, and resolver utilities.

## YOU MUST

1. Select translated documents by language: `*[_type == "page" && slug.current == $slug && language == $locale][0]`. Every top-level query for a translatable type (`TRANSLATABLE_SCHEMA_TYPES` in `studio/sanity.config.ts`) takes the `$locale` param; a reference (`->`) resolves to whichever language version the editor picked. Only the global singleton `siteLanguageSettings` is addressed by `_id`.
2. Project content fields as they are — they are plain values in the document's language. No `{ _key, language, value }` arrays, no `coalesce(field[language==...])`.
3. Reuse snippets from `queries/snippets/`. Check there before adding `slug`, `seo`, `link`, `media`, or module shapes inline.
4. Keep `types/modules/<name>.ts` in sync with `queries/components/modules/<name>.ts` — they are hand-maintained, in the same commit.
5. **NEVER** import from `studio/sanity.types.gen.ts`. Wrong direction.

## Layout

| Path | Purpose |
|---|---|
| `queries/snippets/` | Reusable GROQ fragments — reuse before composing new shapes. |
| `queries/components/modules/` | Per-module projections (one file per `module.<id>`) + barrel. |
| `queries/components/` | Per-component (non-module) projections. |
| `queries/pages/` | Per-route projections. |
| `types/modules/` | Hand-maintained TS shapes per module + barrel. |
| `types/pages.ts` | Page-level types. |
| `fetchSanityData.ts` | `fetch*` helpers; per-language ones take `locale` and pass it as `$locale`. |
| `utils/sanityLocalizedText.ts` | Resolver for `internationalizedArray*` values. Only `resolveLinkLabel.ts` calls it here, for link titles that arrive as arrays. |
| `utils/` | Image builder, module labels, link resolvers, `dataAttr`. |

## Anti-patterns specific to the data layer

- A per-language query without `language == $locale` — returns an arbitrary language's document.
- Porting a `main` query verbatim: `_id` lookups (`*[_id == "home"]`) and `pickLocalizedString` calls don't apply here.
- Importing from `studio/sanity.types.gen.ts`.
- Re-implementing `slug { current, _type }`, `seo { ... }`, or `link { ... }` inline instead of reusing snippets.
- Querying without a matching hand type in `web/sanity/types/`.
