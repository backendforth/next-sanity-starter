# `tailwind/`

Imported **after** `tailwindcss` in `globals.css`.

- **`theme.css`** — `@theme { … }` extensions (fonts, colors, spacing, radii, dark variant) — replaces a legacy JS config file.
- **`safelist.css`** — `@source inline("…")` for class names built at runtime / CMS.

Keep design tokens in `variables/`; only Tailwind-specific hooks (`@theme`, `@source`, rare `@layer`) belong here.
