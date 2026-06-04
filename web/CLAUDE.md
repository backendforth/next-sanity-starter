# web/ — Claude Code subtree rules

Canonical guardrails: @../AGENTS.md. This file only adds web-specific gotchas — see AGENTS.md for the full repo conventions, module pattern, and i18n architecture.

## Stack quirks (non-obvious)

- Next.js 16 App Router only. RSC by default; `"use client"` only when you need state, effects, or browser APIs.
- Path alias `@/*` resolves to `web/` (configured in `web/tsconfig.json`). **NEVER** use `@/*` outside `web/`.
- Biome enforces **tabs** in `web/`. Studio uses 2 spaces — don't copy formatting across boundaries.
- Tailwind v4 (CSS-first config). Tokens live in `web/src/assets/styles/`. No per-component CSS files.

## Locale flow (the part that breaks SSR if you get it wrong)

- **YOU MUST** thread `{ locale, siteLocale }` through every render path that touches Sanity content. The render tree starts at `app/[locale]/page.tsx` and ends in modules.
- **NEVER** read locale from `useRouter()`, `usePathname()`, `window.location`, or cookies inside a module — breaks SSR and Presentation iframes.
- URL/locale helpers live in `web/src/i18n/` (`paths.ts`, `siteLocalePathUtils.ts`, `site-locales.ts`, `proxyLocaleFetch.ts`). Use them; don't concatenate locale prefixes by hand.

## Sanity-side gotchas

- `web/sanity/types/*` are **hand-maintained**. After schema or GROQ projection changes, update the type in the same commit. `pnpm check:wiring` catches missing files; field renames slip through silently.
- **NEVER** import from `studio/sanity.types.gen.ts` — wrong direction, breaks the build.
- Set `data-sanity` attrs on Sanity-rendered roots (copy from `ModuleText.tsx` / `MediaImage.tsx`). Visual Editing depends on it.

## Anti-patterns specific to web

- `import` from `studio/...` — illegal across packages. Share via `packages/*` instead.
- Adding a `<section>` directly inside `app/[locale]/page.tsx` instead of a module.
- `useState` / `useEffect` in a server component (you forgot `"use client"`).
- Bypassing `ModulesRenderer` to render a single module ad hoc.
