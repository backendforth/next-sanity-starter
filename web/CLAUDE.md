# web/ — Claude Code subtree rules

Canonical: @../AGENTS.md. Deep docs: [README.md](README.md), [sanity/README.md](sanity/README.md), [src/i18n/README.md](src/i18n/README.md).

- i18n: document-level — pass the route `locale` into every fetch of a per-language document (`$locale` in GROQ) and `{ locale, siteLocale }` into anything that builds hrefs. Fields arrive in the route's language: render them directly, no `pickLocalizedString` on content fields.
- Server components by default; `"use client"` only for state, effects or browser APIs.
- Next preloads every client component a route's server tree imports, rendered or not. Heavy client code that only some pages render (video players, the carousel, the Visual Editing reorder) goes behind a lazy boundary: `next/dynamic` in a `"use client"` file.
- A boundary with `ssr: true` sets no Suspense of its own. If it can first mount after hydration (an inactive slide becoming active), wrap it in `<Suspense>`, or it suspends the whole route.
- `pnpm --filter web run build && node .github/scripts/bundle-report.mjs` shows first-load JS per route; CI fails a route over its ceiling in `.github/bundle-budget.json`.
- A module gets the locale as a prop, never from the router, the URL or cookies (AGENTS.md §"i18n DO / DON'T").
- Build locale-prefixed URLs with the helpers in `src/i18n/`, never by concatenating prefixes.
- Tailwind v4, CSS-first: tokens live in `src/assets/styles/`; no per-component CSS files.
