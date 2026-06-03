# Query components (`queries/components/`)

GROQ building blocks for **page modules** and **Portable Text** (rich text with embedded modules). Everything is re-exported from **`@/sanity/queries`**.

## `text/`

| File | Export | Purpose |
|------|--------|---------|
| `text/richTextMedia.ts` | `richTextMediaQuery` | Projection for `internationalizedArrayRichTextMedia` / schema `richTextMedia`: blocks, links, embedded `module.*` including nested `module.text` (with depth limit). |

## `modules/`

GROQ **projections for `modules[]`** on documents (and the same module types in **Portable Text** where they appear). Combined as **`modulesQuery`** (`_type` switch → per-module snippets).

| File | Export | Content |
|------|--------|---------|
| `modules/index.ts` | `modulesQuery` | Full `modules[]{ ... }` |
| `modules/text.ts` | `moduleTextQuery` | `module.text` (i18n title + body using `richTextMediaQuery`) |
| `modules/media.ts` | `moduleMediaQuery` | `module.media` |
| `modules/carousel.ts` | `moduleCarouselQuery` | `module.carousel` |
| `modules/contentRefs.ts` | `moduleContentRefsQuery` | `module.contentRefs` (`sourceScope`, `selection`, resolved `references`) |

## Usage

- **Ready-made page queries:** `queries/pages/` — `homeQuery`, `workQuery`, `pageBySlugQuery`, `projectBySlugQuery` embed `modulesQuery`.
- **Snippets:** `queries/snippets/` — `linkQuery`, `pageSeoQuery`, settings, …

## Adding a new module in Studio

1. Add a new `module.*` schema in Studio.
2. Add `modules/<name>.ts` and register it in `modules/index.ts`.
3. If the module also appears in **rich text**, keep `text/richTextMedia.ts` in sync with `studio/.../richTextMedia.ts` and `studio/schemas/fields/modulesArrayField.ts` (`moduleTypes`).
4. Extend types under `web/sanity/types/modules/`.
