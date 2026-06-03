# `src/assets/fonts`

The web app loads **Geist** and **Geist Mono** via **`next/font/google`** in [`app/layout.tsx`](../../app/layout.tsx) — no local files are required.

- **Geist Sans regular** — `text` (md), `big-text` (lg), `heading-2` (2lg), `heading-1` / `content-title` (3lg)
- **Geist Mono semibold** — `heading-3` (lg), `heading-4` (md); tags, buttons, code; `strong` / `em` in body

Stacks are wired in [`../styles/typography/fonts.css`](../styles/typography/fonts.css) and [`../styles/tailwind/theme.css`](../styles/tailwind/theme.css).

## Self-hosting later (optional)

To switch from Google to local files:

1. Add **WOFF2** (or variable-font) files under this folder or `public/fonts/`.
2. Replace `next/font/google` in `layout.tsx` with `next/font/local` (see commented patterns in git history / layout docs).
3. Keep the same CSS variable names: `--font-family-sans`, `--font-family-mono`.

## `font-display`

The app uses **`display: "block"`** on both families (see `layout.tsx`). With `next/font` preload + subsetting, the FOIT window is typically short on first paint.
