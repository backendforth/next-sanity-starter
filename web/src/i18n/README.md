# `src/i18n` — routing and locale config

This folder wires **URL language** to **`[locale]` routes** and shared helpers. **Sanity field resolution** (which translation to show, fallback order) lives in **`sanity/utils/sanityLocalizedText.ts`** — it takes optional **`siteLocale`** from **`fetchSiteLanguageSettings()`** (same source as URLs).

## Files

| File | Role |
|------|------|
| **`fallbackSiteLocales.ts`** | Fallback **en/de** when `siteLanguageSettings` is missing or invalid. |
| **`siteLocalePathUtils.ts`** | `createLanguagePathUtils({ defaultLocale, localeIds })` — `localePath`, prefixes, `isAppLocale`. |
| **`proxyLocaleFetch.ts`** | CDN fetch + short cache for **`proxy.ts`**. |
| **`config.ts`** | `AppLocale` (string), `LOCALE_HEADER_NAME`. |
| **`site-locales.ts`** | `LOCALE_HEADER_NAME` for `proxy.ts` / headers. |
| **`paths.ts`** | `isCurrentNavHref`, path normalization (no locale coupling). |
| **`proxy.ts`** | Rewrites unprefixed URLs to `/{defaultLocale}/…`, sets `LOCALE_HEADER_NAME`. Redirects `/{defaultLocale}/…` to unprefixed canonical URLs. |

## Flow

1. **Sanity** — editors maintain **`siteLanguageSettings`** (ids, labels, default).
2. **Next** — `fetchSiteLanguageSettings()` (cached) supplies **`[locale]/layout.tsx`** → **`LanguageProvider`**, **`Footer`** path utils, **`generateStaticParams`**, **`ModulesRenderer`**, and **`pickLocalizedString`** / Portable Text helpers.
3. User opens `/` or `/about` → **`proxy`** rewrites internally to `/{defaultLocale}/…` using the CDN-backed locale list.
4. User opens `/de/about` → no rewrite; header marks locale `de`.
5. `app/[locale]/page.tsx` (and nested routes) read `params.locale` and pass **`siteLocale`** into resolution helpers.

## Studio note

Changing **Site languages** updates the website on the next fetch. **Studio** loads `internationalizedArray*` tabs from the same document on each load (no rebuild).
