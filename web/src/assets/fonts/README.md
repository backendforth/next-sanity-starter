# `src/assets/fonts`

The starter keeps this folder empty. **Hosted font files** for `@font-face` can live under **`public/fonts/`** (`url("/fonts/…")` in **`src/assets/styles/typography/fonts.css`**) **or** add WOFF2 files here and reference them with **`url("../../fonts/…")`** from that same file — *not* relative to `globals.css`.

Prefer **WOFF2** + **`next/font/local`** (or **`next/font/google`**) in `layout.tsx`, then align `--font-family-*` with what Next emits.

## `font-display`

Default to **`block`**. Up to ~3 s invisible text (FOIT), then fallback, swap to the custom font when it arrives. With `next/font/local` (auto-emitted `<link rel="preload">`, same-origin WOFF2) the invisible window is typically **<200 ms** and not perceivable, while you avoid both the fallback → custom flash (FOUT) and the CLS that come with `swap`.

`auto` behaves like `block` in current Chrome / Firefox / Safari but is browser-defined — prefer `block` for deterministic behavior. `swap` shows a visible FOUT but guarantees the custom font on the first visit. `optional` gives zero CLS but typically renders the fallback for the whole first session (font cached → kicks in from the second visit, even with preload). `fallback` is the middle ground (100 ms block + 3 s swap window, then locks fallback).

To keep the FOIT window of `block` short:

- **Subset** the font to the glyphs you actually use (Latin / Latin-Ext).
- Prefer a **variable font** (1 file covers all weights → only 1 preload).
- `preload: true` only on **above-the-fold** weights; italic / serif headlines that are not in the first viewport should use `preload: false`.
- Keep `adjustFontFallback` enabled (default in `next/font`) — generates a metrics-matched fallback so the eventual swap causes minimal CLS.
