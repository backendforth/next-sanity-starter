# `src/i18n` — routing and locale config

This folder wires **URL language** to **`[locale]` routes** and shared helpers. **Sanity field resolution** (which translation to show, fallback order) lives in **`sanity/utils/sanityLocalizedText.ts`** — it imports locale lists from here.

## Files

| File | Role |
|------|------|
| **`site-locales.ts`** | **Edit this.** `SITE_LOCALES` (supported codes + fallback order) and `SITE_DEFAULT_LOCALE` (language without URL prefix). |
| **`config.ts`** | Re-exports for the app: `locales`, `defaultLocale`, `AppLocale`, `isAppLocale`, `LOCALE_HEADER_NAME`. |
| **`paths.ts`** | `localePath(pathname, locale)` — build correct links for the current language (default = no prefix). |
| **`middleware.ts`** | Rewrites unprefixed URLs to `/{defaultLocale}/…`, sets `LOCALE_HEADER_NAME` for `app/layout.tsx` (`<html lang>`). Redirects `/{defaultLocale}/…` to unprefixed canonical URLs. |

## Flow

1. User opens `/` or `/about` → middleware rewrites to `/en/…` (or whatever `SITE_DEFAULT_LOCALE` is).
2. User opens `/de/about` → no rewrite; header marks locale `de`.
3. `app/[locale]/page.tsx` (and nested routes) read `params.locale` and pass it to **`pickLocalizedString`**, **`ModulesRenderer`**, etc.

## Quick reference

- **Change default language or add languages:** `site-locales.ts` — then restart `pnpm web:dev`.
- **Full examples** (EN vs DE default, adding `fr`): [../../README.md](../../README.md) (section *Languages*).
