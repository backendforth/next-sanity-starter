# Styles (`src/assets/styles`)

Entry: **`tokens.css`** then **`globals.css`** (both from `app/layout.tsx`).

**Why two files:** Tailwind’s pipeline **drops** `sizes.css` / `typography.css` when they only sit after `@import "tailwindcss"` in one file. **`tokens.css`** loads first. **`globals.css`** holds `fonts` → `colors` → Tailwind → **`breakpoints.css`** → utilities → safelist.

## Breakpoints

**`variables/breakpoints.css`** — **`@theme { --breakpoint-* }` only** (single place widths are defined). That drives Tailwind screens (`xs:`, `sm:`, `md:`, …).

**Using those thresholds in custom CSS:**

- **`@media (width >= theme(--breakpoint-md)) { … }`** (and other `--breakpoint-*`) — same values as the utilities; works in **`tokens.css`** imports (e.g. **`sizes.css`**, **`typography.css`**).
- **`@variant md { … }`** (or **`sm`**, **`2xl`**, **`wide`**, …) — wraps rules in the same screen variant as **`md:`** in markup; use in files that load **after** **`@import "tailwindcss"`** (e.g. **`globals.css`**), not in the early **`tokens.css`** chain.

Orientation/touch via **`@custom-variant`** in **`breakpoints.css`**.

It is **imported twice**: in **`tokens.css`** (before sizes/typography) and in **`globals.css`** after **`tailwindcss`**. Same rules may appear in two CSS chunks; that is intentional.

| Folder / file | Role |
|---------------|------|
| `variables/colors.css` | `--color-*`; dark via `prefers-color-scheme` |
| `variables/sizes.css` | layout + `--space-*`, `--content-max-width` / `--content-min-width`, `--container-spacing`; tiers via `theme(--breakpoint-*)` |
| `typography/fonts.css` | Geist / Geist Mono stacks (`next/font/google` in `app/layout.tsx`) |
| `variables/fontsizes.css` | type scale (`--font-size-*`, `--line-height-*`); tiers via `theme(--breakpoint-*)` |
| `variables/typography-clamp.css` | optional fluid `clamp()` — import manually if needed |
| `variables/typography-variable-fonts.css` | optional variable-font axes (`--font-variation-settings-*`, `--font-feature-settings-*`) — import manually if needed |
| `tailwind/theme.css` | `theme.extend` equivalent (`@theme`); **screens** from `breakpoints.css` `@theme` |

Rename or add a token → update the **variable** and the matching **tailwind** key when you expose it as a utility.
