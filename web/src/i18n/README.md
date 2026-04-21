# `src/i18n` — routing and locale config

This folder wires **URL language** to **`[locale]` routes** and shared helpers. **Sanity field resolution** (which translation to show, fallback order) lives in **`sanity/utils/sanityLocalizedText.ts`** — it imports locale lists from here.

## Files

| File | Role |
|------|------|
| **`site-locales.ts`** | Re-exports from **`@repo/languages`** — edit [`packages/languages/src/index.ts`](../../../packages/languages/src/index.ts) instead. |
| **`config.ts`** | Re-exports for the app: `locales`, `defaultLocale`, `AppLocale`, `isAppLocale`, `LOCALE_HEADER_NAME`. |
| **`paths.ts`** | `localePath(pathname, locale)` — build correct links for the current language (default = no prefix). |
| **`proxy.ts`** | Rewrites unprefixed URLs to `/{defaultLocale}/…`, sets `LOCALE_HEADER_NAME` for `app/layout.tsx` (`<html lang>`). Redirects `/{defaultLocale}/…` to unprefixed canonical URLs. |

## Flow

1. User opens `/` or `/about` → proxy rewrites to `/en/…` (or whatever `SITE_DEFAULT_LOCALE` is).
2. User opens `/de/about` → no rewrite; header marks locale `de`.
3. `app/[locale]/page.tsx` (and nested routes) read `params.locale` and pass it to **`pickLocalizedString`**, **`ModulesRenderer`**, etc.

## Quick reference

- **Change default language or add languages:** `packages/languages/src/index.ts` — restart `pnpm web:dev` and `pnpm studio:dev`.
- **Full examples** (EN vs DE default, adding `fr`): [../../README.md](../../README.md) (section *Languages*).
