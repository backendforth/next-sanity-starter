# `src/i18n` — routing and locale config

This folder wires **URL language** to **`[locale]` routes** and shared helpers. Content is translated per document on this branch: each translated Sanity document has a `language` field, and queries select the one for the route with `language == $locale` (see [`sanity/README.md`](../../sanity/README.md)). Fields arrive in that language, so components render them directly.

## Canonical vs fallback

| Source | When it applies |
|--------|-----------------|
| **Sanity `siteLanguageSettings`** | Normal operation — `availableLanguages` (ids = URL segments and document `language` values; order = language switcher order), `defaultLanguageId` (unprefixed URLs + `<html lang>` default after hydration). |
| **Schema `initialValue`** ([`studio/schemas/settings/siteLanguageSettings.ts`](../../../studio/schemas/settings/siteLanguageSettings.ts)) | When an editor **creates** the singleton the first time — pre-fills e.g. `en` + `de` with default `en`. They can change or remove languages before publish (validation still requires ≥1 language and a valid default). |
| **Code fallbacks** | Only when the document is **missing**, **unpublished** in a way that yields empty/invalid data, or **broken** (e.g. default id not in list). |

**Web** uses [`fallbackSiteLocales.ts`](./fallbackSiteLocales.ts) `FALLBACK_SITE_LOCALE_CONFIG` — **minimal `en` only** — via [`sanity/normalizeSiteLocaleConfig.ts`](../../sanity/normalizeSiteLocaleConfig.ts). **Studio** uses the same minimal list in [`studio/config/sync/supportedLanguages.ts`](../../../studio/config/sync/supportedLanguages.ts) (`FALLBACK_LANGUAGES`). Those two constants **must stay in sync** (comments in both files cross-reference).

## Contents

| File | Role |
|------|------|
| **`fallbackSiteLocales.ts`** | Minimal **`en`** fallback when `siteLanguageSettings` is missing or invalid; also used for static bootstrap (e.g. root `<html lang>` before client sync). |
| **`siteLocalePathUtils.ts`** | `createLanguagePathUtils({ defaultLocale, localeIds })` — `localePath`, prefixes, `isAppLocale`. `translationPathsByLocale(translations, pathUtils)` — locale → prefixed path for a document's language variants (slugs differ per language; feeds `hreflang`, the sitemap and the language switch). |
| **`proxyLocaleFetch.ts`** | CDN fetch + short cache for **`proxy.ts`**. |
| **`config.ts`** | `AppLocale` (string), `LOCALE_HEADER_NAME`. |
| **`site-locales.ts`** | `LOCALE_HEADER_NAME` for `proxy.ts` / headers. |
| **`paths.ts`** | `isCurrentNavHref`, path normalization (no locale coupling). |
| **`skipLinkLabel.ts`**, **`uiLabels.ts`** | Fixed UI copy not authored in Sanity (skip link, `aria-label`s, error / 404 fallback, content-refs controls) per locale, English fallback. Add a locale here when you add one in `siteLanguageSettings`. |
| **`../proxy.ts`** (`web/src/proxy.ts`) | Rewrites unprefixed URLs to `/{defaultLocale}/…`, sets `LOCALE_HEADER_NAME`. Redirects `/{defaultLocale}/…` to unprefixed canonical URLs. |

## Flow

1. **Sanity** — editors maintain **`siteLanguageSettings`** (ids, labels, default). First create uses schema **`initialValue`**.
2. **Next** — `fetchSiteLanguageSettings()` (cached) supplies **`[locale]/layout.tsx`** → **`LanguageProvider`**, **`Footer`** path utils, **`generateStaticParams`**, and **`ModulesRenderer`** (href building in `module.contentRefs`).
3. User opens `/` or `/about` → **`proxy`** rewrites internally to `/{defaultLocale}/…` using the CDN-backed locale list.
4. User opens `/de/about` → no rewrite; header marks locale `de`.
5. `app/[locale]/page.tsx` (and nested routes) read `params.locale`, pass it to the `fetch*` helpers (`$locale` in GROQ), and pass **`siteLocale`** to path utils.
6. **Language switch** — every route page renders `LocaleAlternates` with its document's language variants (`translationsQuery`, linked through `translation.metadata`). `setLocale` in `LanguageContext` sends the switch to the variant in the target language (`/about` → `/de/ueber-uns`), or to that language's home when the document has none there. A page without `LocaleAlternates` (the 404) keeps its path and swaps the locale prefix.

## Studio note

Changing **Site languages** updates the website on the next fetch. **Studio** (`@sanity/document-internationalization`) reads the same document once per session — reload the Studio to pick up a change (no rebuild).
