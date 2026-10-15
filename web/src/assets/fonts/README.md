# `src/assets/fonts`

The web app loads **Geist** and **Geist Mono** via **`next/font/google`** in [`components/layout/DocumentShell.tsx`](../../components/layout/DocumentShell.tsx) — no local files are required.

- **Geist Sans regular** — `text` (md), `big-text` (lg), `heading-2` (2lg), `heading-1` / `content-title` (3lg)
- **Geist Mono semibold** — `heading-3` (lg), `heading-4` (md); tags, buttons, code; `strong` / `em` in body

The `font-text` / `font-mono` stacks are wired in [`../styles/tailwind/theme.css`](../styles/tailwind/theme.css) (`@theme inline`, so they resolve wherever the `next/font` class sits).

## Self-hosting later (optional)

To switch from Google to local files:

1. Add **WOFF2** (or variable-font) files under this folder or `public/fonts/`.
2. Replace `next/font/google` in `components/layout/DocumentShell.tsx` with `next/font/local`.
3. Keep the same CSS variable names: `--font-family-sans`, `--font-family-mono`.

## `font-display`

Both families use **`display: "swap"`** (`DocumentShell.tsx`): text paints at once in the metrics-adjusted fallback `next/font` generates, then swaps to Geist.
