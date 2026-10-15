# web/sanity/ — Claude Code subtree rules

Canonical: @../../AGENTS.md §i18n. Deep doc: @./README.md and @./queries/README.md.

This is the **data layer**: GROQ queries, the names for their generated types, and resolver utilities.

## YOU MUST

1. **NEVER** filter locale inside GROQ. Project the full `{ _key, _type, language, value }` array. Locale resolves at React render time. `coalesce(field[language=="en"]...)` is forbidden — breaks fallback.
2. Reuse snippets from `queries/snippets/`. Check there before adding `slug`, `seo`, `link`, `media`, or module shapes inline.
3. Use `pickLocalizedString` / `pickLocalizedPortableTextBlocks` / `pickLocalizedValue` from `utils/sanityLocalizedText.ts` for **all** locale resolution. Don't index i18n arrays directly.
4. Fragments are plain `const` template strings; every full query is a `defineQuery`. No function calls in queries — TypeGen skips them and `pnpm generate` fails (`check:typegen`). Name result types in `types.ts`, derived from `sanity.types.gen.ts`; never hand-write them.
5. **NEVER** import from `studio/sanity.types.gen.ts`. Wrong direction.

## Layout

| Path | Purpose |
|---|---|
| `queries/snippets/` | Reusable GROQ fragments — reuse before composing new shapes. |
| `queries/components/modules/` | Per-module projections (one file per `module.<id>`) + barrel. |
| `queries/components/` | Per-component (non-module) projections. |
| `queries/pages/` | Per-route projections. |
| `types.ts` | Names for the generated query types (`ModuleOf<…>`, `SiteCookieBanner`, …), stega-branded like `sanityFetch` returns them. |
| `sanity.types.gen.ts` | TypeGen output (`pnpm generate`). Never edit. |
| `utils/sanityLocalizedText.ts` | **Canonical** locale resolver — extend here, don't fork. |
| `utils/` | Image builder, module labels, link resolvers, `dataAttr`, `isStegaVariant`. |

## Resolver utilities

| Utility | Use for |
|---|---|
| `pickLocalizedString(entries, locale, siteLocale)` | Single i18n string. |
| `pickLocalizedPortableTextBlocks(entries, locale, siteLocale)` | Rich-text bodies; embedded modules resolve their own fields. |
| `pickLocalizedValue(entries, locale, siteLocale)` | Any other i18n value, typed by the entry. |

If you need a new resolver, extend `sanityLocalizedText.ts` — don't write a parallel one in a component.

## Anti-patterns specific to the data layer

- Indexing i18n arrays directly (`title[0].value`, `title.find(t => t.language === "en").value`).
- `coalesce(field[language==$locale].value, ...)` in GROQ.
- Importing from `studio/sanity.types.gen.ts`.
- Re-implementing `slug { current, _type }`, `seo { ... }`, or `link { ... }` inline instead of reusing snippets.
- A query outside `defineQuery`, or an `as` cast on fetched data.
- Comparing a fetched string to a literal without `stegaClean` / `isStegaVariant` (always `false` in Presentation).
