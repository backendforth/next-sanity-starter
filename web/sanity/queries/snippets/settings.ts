import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { linkQuery } from "./link";
import { imageQuery } from "./media";
import { pageSeoQuery } from "./seo";

/**
 * Portable Text `body[]` projection for plain `richText` fields (no embedded
 * modules) — resolves `link` annotations.
 */
const richTextBody = `[]{
  ...,
  markDefs[]{
    ...,
    _type == "link" => {
      ${linkQuery}
    }
  }
}`;

/** Main menu: links plus optional `nav.languageSwitch` blocks (order preserved). */
const navMainMenuQuery = `mainMenu[]{
  _key,
  _type,
  _type == "link" => {
    _key,
    _type,
    ${linkQuery}
  },
  _type == "nav.languageSwitch" => {
    _key,
    _type
  },
  _type == "nav.themeToggle" => {
    _key,
    _type
  }
}`;

/** Footer: links only. */
const navFooterMenuQuery = `footerMenu[]{
  _key,
  _type,
  ${linkQuery}
}`;

/** Main + footer link lists with resolved `link` objects (`internal` / `external` / `function`). */
export const navMenusQuery = `
  "mainMenu": ${navMainMenuQuery},
  "footerMenu": ${navFooterMenuQuery}
`;

/**
 * `siteNav` for the active locale. Falls back to a legacy document with no
 * `language` (pre–document-level i18n) when no locale-specific doc exists.
 */
const siteNavByLocale = `coalesce(
  *[_type == "siteNav" && language == $locale][0],
  *[_type == "siteNav" && !defined(language)][0]
)`;

/** Document type: `siteNav` (one per language; see studio structure). */
export const siteNavQuery = `${siteNavByLocale}{
  _id,
  title,
  language,
  ${navMenusQuery},
  ${modulesQuery}
}`;

/**
 * Same resolved menus as `siteNavQuery` without `modules[]` (lighter layout fetch).
 *
 * Not wrapped in `defineQuery`: Sanity Typegen cannot resolve the `link`
 * projection here and mis-types `mainMenu`/`footerMenu` as `null`. The
 * hand-written `SiteNavMenusDocument` (sanity/types/nav.ts) is authoritative.
 */
export const siteNavMenusQuery = `${siteNavByLocale}{
  _id,
  title,
  language,
  ${navMenusQuery}
}`;

/** Document id: `siteLanguageSettings` — the global locale registry. */
export const siteLanguageSettingsQuery =
	defineQuery(`*[_id == "siteLanguageSettings"][0]{
  _id,
  availableLanguages[]{id, title},
  defaultLanguageId
}`);

/** Minimal fetch for `app/[locale]/layout.tsx` `generateMetadata` (tab title template). */
export const siteSettingsTitleQuery = defineQuery(
	`*[_type == "siteSettings" && language == $locale][0]{title}`,
);

/** `siteSettings.favicon` for root metadata icons — `app/favicon.ico` is the static fallback. */
export const siteSettingsFaviconQuery = defineQuery(
	`*[_type == "siteSettings" && language == $locale][0]{
  "faviconUrl": favicon.asset->url
}`,
);

/** Site-wide SEO fallback for route `generateMetadata` (deduped via `fetchSettingsSeoFallback`). */
export const siteSettingsSeoFallbackQuery =
	defineQuery(`*[_type == "siteSettings" && language == $locale][0]{
  "title": seo.title,
  "description": seo.description,
  "imageUrl": seo.image.asset->url
}`);

/** Document type: `siteSettings` (one per language). */
export const siteSettingsQuery = `*[_type == "siteSettings" && language == $locale][0]{
  _id,
  title,
  language,
  "favicon": favicon${imageQuery},
  ${modulesQuery},
  ${pageSeoQuery}
}`;

/** Document type: `errorSettings` (one per language). */
export const errorSettingsQuery = `*[_type == "errorSettings" && language == $locale][0]{
  _id,
  language,
  notFoundTitle,
  "notFoundBody": notFoundBody${richTextBody},
  serverErrorTitle,
  "serverErrorBody": serverErrorBody${richTextBody},
  ${modulesQuery}
}`;

/** Document type: `siteCookieBanner` (one per language). */
export const siteCookieBannerQuery = `*[_type == "siteCookieBanner" && language == $locale][0]{
  _id,
  title,
  language,
  useCookieBanner,
  consentModal,
  preferencesModal,
  ${modulesQuery}
}`;

/**
 * Lightweight cookie banner projection for the app shell — same document as
 * `siteCookieBannerQuery` but without `modules[]`, mirroring `siteNavMenusQuery`.
 */
export const siteCookieBannerLayoutQuery =
	defineQuery(`*[_type == "siteCookieBanner" && language == $locale][0]{
  _id,
  language,
  useCookieBanner,
  consentModal,
  preferencesModal
}`);

/**
 * Single fetch for app shell: settings, nav, errors, cookie banner.
 * Document types match Studio Documents: siteSettings, siteNav, errorSettings, siteCookieBanner.
 *
 * NOTE: not consumed by any current route — provided as a convenience aggregate
 * (and the reason `siteSettingsQuery`, `siteNavQuery`, `siteCookieBannerQuery`
 * exist) for apps that prefer one combined app-shell fetch over the per-document
 * `fetch*` helpers in `fetchSanityData.ts`. Safe to delete if unused.
 */
export const settingsBundleQuery = `{
  "siteSettings": ${siteSettingsQuery},
  "siteNav": ${siteNavQuery},
  "errorSettings": ${errorSettingsQuery},
  "siteCookieBanner": ${siteCookieBannerQuery}
}`;
