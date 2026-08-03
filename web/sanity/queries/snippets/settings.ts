import { defineQuery } from "next-sanity";

import { linkQuery } from "./link";

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

/**
 * Document type: `siteNav` (one per language) — resolved menus without
 * `modules[]` (layout fetch).
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

/**
 * Document type: `errorSettings` (one per language) — 404 / 500 copy only. The
 * document's `modules[]` field is deliberately not projected: no error page
 * renders modules, and embedding `modulesQuery` here inflated the query from
 * ~2 KB to ~79 KB.
 */
export const errorSettingsQuery = `*[_type == "errorSettings" && language == $locale][0]{
  _id,
  language,
  notFoundTitle,
  "notFoundBody": notFoundBody${richTextBody},
  serverErrorTitle,
  "serverErrorBody": serverErrorBody${richTextBody}
}`;

/**
 * Document type: `siteCookieBanner` (one per language) — banner copy for the
 * app shell, no `modules[]`.
 */
export const siteCookieBannerLayoutQuery =
	defineQuery(`*[_type == "siteCookieBanner" && language == $locale][0]{
  _id,
  language,
  useCookieBanner,
  consentModal,
  preferencesModal
}`);
