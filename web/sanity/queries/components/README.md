# Query components (`queries/components/`)

GROQ building blocks for **page modules** and **Portable Text** (rich text with embedded modules). Everything is re-exported from **`@/sanity/queries`**.

## `text/`

| File | Export | Purpose |
|------|--------|---------|
| `text/richTextMedia.ts` | `richTextMediaQuery` | Projection for schema `richTextMedia` fields (plain Portable Text in the document's language): blocks, links, embedded `module.media` and `module.carousel` (the editor's whole `of` set). Flat, no recursion. |

## `modules/`

GROQ **projections for `modules[]`** on documents (and the same module types in **Portable Text** where they appear). Combined as **`modulesQuery`** (`_type` switch → per-module snippets).

| File | Export | Content |
|------|--------|---------|
| `modules/index.ts` | `modulesQuery` | Full `modules[]{ ... }` |
| `modules/text.ts` | `moduleTextQuery` | `module.text` (title + body using `richTextMediaQuery`) |
| `modules/media.ts` | `moduleMediaQuery` | `module.media` |
| `modules/carousel.ts` | `moduleCarouselQuery` | `module.carousel` |
| `modules/contentRefs.ts` | `moduleContentRefsQuery` | `module.contentRefs` (`sourceScope`, `selection`, resolved `references`). With `selection == "all"` it lists documents filtered by `language == $locale`, so every query that embeds `modulesQuery` must pass `$locale`. |

## Usage

- **Ready-made page queries:** `queries/pages/` — `homeQuery`, `workQuery`, `pageBySlugQuery`, `projectBySlugQuery` embed `modulesQuery`.
- **Snippets:** `queries/snippets/` — `linkQuery`, `pageSeoQuery`, settings, …

## Adding a module

`pnpm gen:module <Name>` writes `modules/<name>.ts` and lists it in `modulesQuery` (with `--inline`, in `richTextMediaQuery` too). By hand, follow the wiring checklist in [`AGENTS.md`](../../../../AGENTS.md) → "The module pattern". The module's type is `ModuleOf<"module.<id>">` after `pnpm generate`; nothing to write by hand.
