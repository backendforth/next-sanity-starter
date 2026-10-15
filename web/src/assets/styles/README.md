# Styles (`src/assets/styles`)

Entry: **`tokens.css`** then **`globals.css`** (both from `components/layout/DocumentShell.tsx`; the layout-less `app/not-found.tsx` and `app/global-error.tsx` import them too).

**Why two files:** Tailwind’s pipeline **drops** `sizes.css` / `fontsizes.css` when they only sit after `@import "tailwindcss"` in one file. **`tokens.css`** loads first: `breakpoints.css` → `sizes.css` → `fontsizes.css`. **`globals.css`** holds `colors` → **`breakpoints.css`** → safelist → animations → Tailwind → `tailwind/theme.css` → typography → rich text → Mux player.

## Breakpoints

**`variables/breakpoints.css`** — **`@theme { --breakpoint-* }` only** (single place widths are defined). That drives Tailwind screens (`xs:`, `sm:`, `md:`, …).

**Using those thresholds in custom CSS:**

- **`@media (width >= theme(--breakpoint-md)) { … }`** (and other `--breakpoint-*`) — same values as the utilities; works in **`tokens.css`** imports (e.g. **`sizes.css`**, **`fontsizes.css`**).
- **`@variant md { … }`** (or **`sm`**, **`2xl`**, **`wide`**, …) — wraps rules in the same screen variant as **`md:`** in markup; use in files that load **after** **`@import "tailwindcss"`** (e.g. **`globals.css`**), not in the early **`tokens.css`** chain.

Orientation/touch via **`@custom-variant`** in **`breakpoints.css`**.

It is **imported twice**: in **`tokens.css`** (before sizes / font sizes) and in **`globals.css`**. Same rules may appear in two CSS chunks; that is intentional.

| Folder / file | Role |
|---------------|------|
| `variables/colors.css` | `--color-*`; dark tokens under `:root[data-theme="dark"]`, set by the theme toggle (OS preference is ignored) |
| `variables/sizes.css` | layout + `--space-*`, `--content-max-width`, `--container-spacing`; tiers via `theme(--breakpoint-*)` |
| `variables/fontsizes.css` | type scale (`--font-size-*`, `--line-height-*`) and the `html` size (`--font-size-root`); tiers via `theme(--breakpoint-*)` |
| `variables/typography-variable-fonts.css` | optional variable-font axes (`--font-variation-settings-*`, `--font-feature-settings-*`) — import manually if needed |
| `tailwind/theme.css` | `theme.extend` equivalent (`@theme`); font stacks in `@theme inline` (Geist / Geist Mono from `next/font/google` in `components/layout/documentFonts.ts`); **screens** from `breakpoints.css` `@theme` |

Rename or add a token → update the **variable** and the matching **tailwind** key when you expose it as a utility.
