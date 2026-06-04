# web/sanity/ — Claude Code subtree rules

> Canonical: [`/AGENTS.md`](../../AGENTS.md). Deep doc: [`./README.md`](./README.md) and [`./queries/README.md`](./queries/README.md).

This is the **data layer**: GROQ queries, hand-maintained TS shapes, and resolver utilities. It sits between the Sanity dataset and the React layer.

## Layout

| Path | Purpose |
|---|---|
| `queries/snippets/` | Reusable GROQ fragments (`seo`, `slug`, `link`, `media`, `localized*`). Reuse before composing new shapes. |
| `queries/components/modules/` | Per-module projections. One file per `module.<id>`. |
| `queries/components/` | Per-component (non-module) projections. |
| `queries/pages/` | Per-route projections (page, project, work, ...). |
| `types/modules/` | TS shapes per module (hand-maintained — see below). |
| `types/pages.ts` | Page-level types. |
| `utils/sanityLocalizedText.ts` | **Canonical** locale resolver. |
| `utils/` | Image builder, module labels, slug utils, dataset resolve. |

## Hard rules

1. **No locale filtering in GROQ.** Project full `{ _key, _type, language, value }` arrays. Locale resolution happens in React via `utils/sanityLocalizedText.ts`. `coalesce(field[language=="en"].value, ...)` is forbidden.
2. **Reuse snippets.** Look in `queries/snippets/` before adding `slug`, `seo`, `link`, `media`, or module shapes inline.
3. **Types here are hand-maintained.** `web/sanity/types/*` are NOT generated. When you change a GROQ projection, update the matching type in the same commit. Studio typegen (`studio/sanity.types.gen.ts`) is a separate artifact — do not import from it here.
4. **Per-module file naming.** A module's query lives at `queries/components/modules/<name>.ts` and its type at `types/modules/<name>.ts`. Both must be re-exported from their `index.ts` barrels.
5. **i18n shape is the plugin shape.** `internationalizedArray*` returns `{ _key, _type, language, value }[]`. Type fields accordingly; never as plain `string` / `PortableTextBlock[]`.

## Locale resolution

Always go through `web/sanity/utils/sanityLocalizedText.ts`:

| Utility | Use for |
|---|---|
| `pickLocalizedString(entries, locale, siteLocale)` | Single i18n string. |
| `parseLocalizedText({ value, locale, siteLocale, as })` | String or Portable Text (polymorphic). |
| `resolveLocalizedPortableTextDeep(entries, locale, siteLocale)` | Portable Text with embedded i18n marks/modules. |

If you find yourself writing a new resolver in a component, extend `sanityLocalizedText.ts` instead.

## After schema or query changes

```bash
pnpm studio:generate     # if a schema field changed
pnpm typecheck
pnpm format
```

## Anti-patterns

- Indexing i18n arrays directly (`title[0].value`, `title.find(t => t.language === "en").value`).
- `coalesce(field[language==$locale].value, ...)` in GROQ.
- Importing from `studio/sanity.types.gen.ts`.
- Re-implementing `slug { current, _type }`, `seo { title, description, ... }`, or `link { _type, ... }` inline instead of reusing snippets.
- Querying without a matching hand type in `web/sanity/types/`.
