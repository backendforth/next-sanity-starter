# Styles (`src/assets/styles`)

Entry: **`tokens.css`** then **`globals.css`** (both from `app/layout.tsx`).

**Why two files:** Tailwind’s pipeline **drops** `sizes.pcss` / `typography.pcss` when they only sit after `@import "tailwindcss"` in one file. **`tokens.css`** loads first. **`globals.css`** holds `fonts` → `colors` → Tailwind → **`breakpoints.pcss`** → utilities → safelist.

## Breakpoints

**`variables/breakpoints.pcss`** — **`@theme { --breakpoint-* }` only** (single place widths are defined). That drives Tailwind screens (`xs:`, `sm:`, `md:`, …).

**Using those thresholds in custom CSS:**

- **`@media (width >= theme(--breakpoint-md)) { … }`** (and other `--breakpoint-*`) — same values as the utilities; works in **`tokens.css`** imports (e.g. **`sizes.pcss`**, **`typography.pcss`**).
- **`@variant md { … }`** (or **`sm`**, **`2xl`**, **`wide`**, …) — wraps rules in the same screen variant as **`md:`** in markup; use in files that load **after** **`@import "tailwindcss"`** (e.g. **`globals.css`**), not in the early **`tokens.css`** chain.

Orientation/touch via **`@custom-variant`** in **`breakpoints.pcss`**.

It is **imported twice**: in **`tokens.css`** (before sizes/typography) and in **`globals.css`** after **`tailwindcss`**. Same rules may appear in two CSS chunks; that is intentional.

| Folder / file | Role |
|---------------|------|
| `variables/colors.pcss` | `--color-*`; dark via `prefers-color-scheme` |
| `variables/sizes.pcss` | layout + `--space-*`, `--content-max-width` / `--content-min-width`, `--container-spacing`; tiers via `theme(--breakpoint-*)` |
| `variables/typography.pcss` | type scale; same `theme(--breakpoint-*)` tiers |
| `variables/typography-clamp.css` | optional fluid `clamp()` — import manually if needed |
| `tailwind.config.ts` | `theme.extend` → CSS vars; **screens** from `breakpoints.pcss` `@theme` |

Rename or add a token → update the **variable** and the matching **tailwind** key when you expose it as a utility.
