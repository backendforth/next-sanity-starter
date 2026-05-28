# `src/i18n` — routing and locale config

This folder wires **URL language** to **`[locale]` routes** and shared helpers. **Sanity field resolution** (which translation to show, fallback order) lives in **`sanity/utils/sanityLocalizedText.ts`** — it takes optional **`siteLocale`** from **`fetchSiteLanguageSettings()`** (same source as URLs).

## Canonical vs fallback

| Source | When it applies |
|--------|-----------------|
| **Sanity `siteLanguageSettings`** | Normal operation — `availableLanguages` (order = translation fallback order), `defaultLanguageId` (unprefixed URLs + `<html lang>` default after hydration). |
| **Schema `initialValue`** ([`studio/schemas/settings/siteLanguageSettings.ts`](../../../studio/schemas/settings/siteLanguageSettings.ts)) | When an editor **creates** the singleton the first time — pre-fills e.g. `en` + `de` with default `en`. They can change or remove languages before publish (validation still requires ≥1 language and a valid default). |
| **Code fallbacks** | Only when the document is **missing**, **unpublished** in a way that yields empty/invalid data, or **broken** (e.g. default id not in list). |

**Web** uses [`fallbackSiteLocales.ts`](./fallbackSiteLocales.ts) `FALLBACK_SITE_LOCALE_CONFIG` — **minimal `en` only** — via [`sanity/normalizeSiteLocaleConfig.ts`](../../sanity/normalizeSiteLocaleConfig.ts). **Studio** uses the same minimal list in [`studio/config/sync/internationalizedArrayLanguages.ts`](../../../studio/config/sync/internationalizedArrayLanguages.ts) (`FALLBACK_LANGUAGES`). Those two constants **must stay in sync** (comments in both files cross-reference).

## Contents

| File | Role |
|------|------|
| **`fallbackSiteLocales.ts`** | Minimal **`en`** fallback when `siteLanguageSettings` is missing or invalid; also used for static bootstrap (e.g. root `<html lang>` before client sync). |
| **`siteLocalePathUtils.ts`** | `createLanguagePathUtils({ defaultLocale, localeIds })` — `localePath`, prefixes, `isAppLocale`. |
| **`proxyLocaleFetch.ts`** | CDN fetch + short cache for **`proxy.ts`**. |
| **`config.ts`** | `AppLocale` (string), `LOCALE_HEADER_NAME`. |
| **`site-locales.ts`** | `LOCALE_HEADER_NAME` for `proxy.ts` / headers. |
| **`paths.ts`** | `isCurrentNavHref`, path normalization (no locale coupling). |
| **`proxy.ts`** | Rewrites unprefixed URLs to `/{defaultLocale}/…`, sets `LOCALE_HEADER_NAME`. Redirects `/{defaultLocale}/…` to unprefixed canonical URLs. |

## Flow

1. **Sanity** — editors maintain **`siteLanguageSettings`** (ids, labels, default). First create uses schema **`initialValue`**.
2. **Next** — `fetchSiteLanguageSettings()` (cached) supplies **`[locale]/layout.tsx`** → **`LanguageProvider`**, **`Footer`** path utils, **`generateStaticParams`**, **`ModulesRenderer`**, and **`pickLocalizedString`** / Portable Text helpers.
3. User opens `/` or `/about` → **`proxy`** rewrites internally to `/{defaultLocale}/…` using the CDN-backed locale list.
4. User opens `/de/about` → no rewrite; header marks locale `de`.
5. `app/[locale]/page.tsx` (and nested routes) read `params.locale` and pass **`siteLocale`** into resolution helpers.

## Studio note

Changing **Site languages** updates the website on the next fetch. **Studio** loads `internationalizedArray*` tabs from the same document on each load (no rebuild).
