# web/ — Claude Code subtree rules

> Canonical: [`/AGENTS.md`](../AGENTS.md). This file scopes the web-app conventions.

## Stack

- Next.js 16, App Router only. Route segments live under `web/src/app/[locale]/...`.
- React Server Components by default; reach for `"use client"` only when you need state, effects, or browser APIs.
- Tailwind CSS v4 (token-driven). Styles live in `web/src/assets/styles/`; see that folder's README.
- Path alias: `@/*` → `web/`. Use it for absolute imports. Never deeper-relative paths like `../../../sanity/...`.

## Hard rules

1. **Locale awareness everywhere.** Every page/component that touches Sanity content threads `{ locale, siteLocale }` through props. Resolve translatable fields with `pickLocalizedString` / `parseLocalizedText` from `web/sanity/utils/sanityLocalizedText.ts`. Never index i18n arrays.
2. **No GROQ locale filtering.** Project full `{ _key, _type, language, value }` arrays. Resolution happens at render.
3. **Content blocks are modules.** New page sections go through the 8-step wiring (see `/AGENTS.md` §"The module pattern"). No ad-hoc `<section>` in route files.
4. **Hand-maintained Sanity types.** `web/sanity/types/*` are NOT generated. When a schema field changes, update both the GROQ projection in `web/sanity/queries/components/` and the matching type. Never import from `studio/sanity.types.gen.ts`.
5. **Visual Editing.** Components that render Sanity content set `data-sanity` attributes — copy the pattern from `ModuleText.tsx` or `MediaImage.tsx`. Breaking these breaks click-to-edit in Presentation.
6. **No browser-only locale reads.** Do not read locale from `useRouter()`, `window.location`, or `document.cookie` inside a module — it breaks SSR and Presentation iframes.

## Locale URL helpers

Path-shaping utilities live in `web/src/i18n/`:

- `paths.ts`, `siteLocalePathUtils.ts` — build/parse `/{locale}/{slug}` URLs.
- `site-locales.ts`, `fallbackSiteLocales.ts` — runtime locale config + offline fallback.
- `proxyLocaleFetch.ts` — server-side site-locale fetch with caching.

Use these. Do not concatenate locale prefixes by hand.

## Tooling

After web-only changes:

```bash
pnpm typecheck
pnpm format
```

After web changes that depend on a schema edit, first run `pnpm studio:generate` in the studio app, then re-run typecheck here.

## Never edit

- `web/.next/`
- Any `*.gen.*` files
- Files copied from `studio/sanity.types.gen.ts` — they are studio-side only

## Anti-patterns

- `import` from `studio/...` — illegal across packages. Share via `packages/*` instead.
- Hardcoded locale codes (`"en"`, `"de"`) anywhere outside `web/src/i18n/`.
- `useState` / `useEffect` in a server component (forgetting `"use client"`).
- Bypassing `ModulesRenderer` to render a single module ad hoc — keeps Visual Editing wiring consistent only when going through the renderer.
