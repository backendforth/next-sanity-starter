# web/sanity/ — Claude Code subtree rules

Canonical: @../../AGENTS.md §i18n. Deep doc: @./README.md and @./queries/README.md.

This is the **data layer**: GROQ queries, hand-maintained TS shapes, and resolver utilities.

## YOU MUST

1. **NEVER** filter locale inside GROQ. Project the full `{ _key, _type, language, value }` array. Locale resolves at React render time. `coalesce(field[language=="en"]...)` is forbidden — breaks fallback.
2. Reuse snippets from `queries/snippets/`. Check there before adding `slug`, `seo`, `link`, `media`, or module shapes inline.
3. Use `pickLocalizedString` / `parseLocalizedText` / `resolveLocalizedPortableTextDeep` from `utils/sanityLocalizedText.ts` for **all** locale resolution. Don't index i18n arrays directly.
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
| `utils/sanityLocalizedText.ts` | **Canonical** locale resolver — extend here, don't fork. |
| `utils/` | Image builder, module labels, slug utils, dataset resolve. |

## Resolver utilities

| Utility | Use for |
|---|---|
| `pickLocalizedString(entries, locale, siteLocale)` | Single i18n string. |
| `parseLocalizedText({ value, locale, siteLocale, as })` | String or Portable Text (`as: "auto" \| "string" \| "blocks"`). |
| `resolveLocalizedPortableTextDeep(entries, locale, siteLocale)` | Portable Text with embedded i18n marks/modules. |

If you need a new resolver, extend `sanityLocalizedText.ts` — don't write a parallel one in a component.

## Anti-patterns specific to the data layer

- Indexing i18n arrays directly (`title[0].value`, `title.find(t => t.language === "en").value`).
- `coalesce(field[language==$locale].value, ...)` in GROQ.
- Importing from `studio/sanity.types.gen.ts`.
- Re-implementing `slug { current, _type }`, `seo { ... }`, or `link { ... }` inline instead of reusing snippets.
- Querying without a matching hand type in `web/sanity/types/`.
