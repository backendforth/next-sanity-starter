# `tailwind/`

Imported **after** `tailwindcss` in `globals.css`.

- **`safelist.css`** — `@source inline("…")` for class names built at runtime / CMS.

Keep design tokens in `variables/`; only Tailwind-specific hooks (`@source`, rare `@layer`) belong here.
