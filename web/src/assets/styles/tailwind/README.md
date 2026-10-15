# `tailwind/`

`globals.css` imports `safelist.css` before `tailwindcss` and `theme.css` after it.

- **`theme.css`** — `@theme { … }` extensions (font stacks, colors, spacing, container width, dark variant) — replaces a legacy JS config file.
- **`safelist.css`** — `@source inline("…")` for class names built at runtime / CMS.

Keep design tokens in `variables/`; only Tailwind-specific hooks (`@theme`, `@source`, rare `@layer`) belong here.
