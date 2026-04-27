# `src/assets/fonts`

Boilerplate keeps this folder empty. **Hosted font files** for `@font-face` can live under **`public/fonts/`** (`url("/fonts/…")` in **`src/assets/styles/typography/fonts.css`**) **or** add WOFF2 files here and reference them with **`url("../../fonts/…")`** from that same file — *not* relative to `globals.css`.

Prefer **WOFF2** and `font-display: optional`. Alternative: **`next/font/local`** or **`next/font/google`** in `layout.tsx`, then align `--font-family-*` with what Next emits.
