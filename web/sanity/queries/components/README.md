# Query components (`queries/components/`)

GROQ building blocks for **page modules** and **Portable Text** (rich text with embedded modules). They are fragments: import them from their file; the full queries embed them.

## `text/`

| File | Export | Purpose |
|------|--------|---------|
| `text/richTextMedia.ts` | `richTextMediaQuery`, `richTextMediaBodyQuery`, `blockFields` | `richTextMediaQuery` projects a `richTextMedia` value (plain Portable Text in the document's language): blocks with resolved links, plus the inline modules `module.media` and `module.carousel` (the editor's whole `of` set). Flat, no recursion. `richTextMediaBodyQuery` applies it to a `body` field; `blockFields` is the blocks-only part. |

## `modules/`

GROQ **projections for `modules[]`** on documents (and the same module types in **Portable Text** where they appear). Combined as **`modulesQuery`** (`_type` switch → per-module snippets).

| File | Export | Content |
|------|--------|---------|
| `modules/index.ts` | `modulesQuery` | Full `modules[]{ ... }` |
| `modules/text.ts` | `moduleTextQuery` | `module.text` (heading + body using `richTextMediaBodyQuery`) |
| `modules/media.ts` | `moduleMediaQuery` | `module.media` |
| `modules/carousel.ts` | `moduleCarouselQuery` | `module.carousel` |
| `modules/contentRefs.ts` | `moduleContentRefsQuery` | `module.contentRefs` (`sourceScope`, resolved `references`: every routable target of the scope in `$locale`, newest first, or the editor's picks in order). The `$locale` filter means every query that embeds `modulesQuery` must pass `$locale`. |

## Usage

- **Ready-made page queries:** `queries/pages/` — `homeQuery`, `workQuery` and `pageBySlugQuery` embed `modulesQuery`; `projectBySlugQuery` embeds `richTextMediaBodyQuery`.
- **Snippets:** `queries/snippets/` — `linkQuery`, `pageSeoQuery`, settings, …

## Adding a module

`pnpm gen:module <Name>` writes `modules/<name>.ts` and lists it in `modulesQuery` (with `--inline`, in `richTextMediaQuery` too). By hand, follow the wiring checklist in [`AGENTS.md`](../../../../AGENTS.md) → "The module pattern". The module's type is `ModuleOf<"module.<id>">` after `pnpm generate`; nothing to write by hand.
