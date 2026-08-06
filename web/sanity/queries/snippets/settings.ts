import { defineQuery } from "next-sanity";

import { linkQuery } from "./link";

/**
 * `internationalizedArrayRichText` field: array of { language, value: portable text }.
 * Resolves link annotations like module text bodies.
 */
function internationalizedRichTextArrayField(fieldName: string): string {
	return `${fieldName}[]{
  _key,
  _type,
  language,
  value[]{
    ...,
    markDefs[]{
      ...,
      _type == "link" => {
        ${linkQuery}
      }
    }
  }
}`;
}

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
 * Document id: `siteNav` — resolved menus without `modules[]` (layout fetch).
 *
 * Not wrapped in `defineQuery`: Sanity Typegen cannot resolve the `link`
 * projection here and mis-types `mainMenu`/`footerMenu` as `null`. The
 * hand-written `SiteNavMenusDocument` (sanity/types/nav.ts) is authoritative.
 */
export const siteNavMenusQuery = `*[_id == "siteNav"][0]{
  _id,
  title,
  ${navMenusQuery}
}`;

/** Document id: `siteLanguageSettings` — drives Next routes + `internationalizedArray` codegen in Studio. */
export const siteLanguageSettingsQuery =
	defineQuery(`*[_id == "siteLanguageSettings"][0]{
  _id,
  availableLanguages[]{id, title},
  defaultLanguageId
}`);

/** Minimal fetch for `app/[locale]/layout.tsx` `generateMetadata` (tab title template). */
export const siteSettingsTitleQuery = defineQuery(
	`*[_id == "siteSettings"][0]{title}`,
);

/** `siteSettings.favicon` for root metadata icons — `app/favicon.ico` is the static fallback. */
export const siteSettingsFaviconQuery = defineQuery(
	`*[_id == "siteSettings"][0]{
  "faviconUrl": favicon.asset->url
}`,
);

/** Site-wide SEO fallback for route `generateMetadata` (deduped via `fetchSettingsSeoFallback`). */
export const siteSettingsSeoFallbackQuery =
	defineQuery(`*[_id == "siteSettings"][0]{
  "title": seo.title,
  "description": seo.description,
  "imageUrl": seo.image.asset->url
}`);

/**
 * Document id: `errorSettings` — 404 / 500 copy only. The document's
 * `modules[]` field is deliberately not projected: no error page renders
 * modules, and embedding `modulesQuery` here inflated the query from ~2 KB
 * to ~79 KB.
 */
export const errorSettingsQuery = `*[_id == "errorSettings"][0]{
  _id,
  notFoundTitle,
  ${internationalizedRichTextArrayField("notFoundBody")},
  serverErrorTitle,
  ${internationalizedRichTextArrayField("serverErrorBody")}
}`;

/** Document id: `siteCookieBanner` — banner copy for the app shell, no `modules[]`. */
export const siteCookieBannerLayoutQuery =
	defineQuery(`*[_id == "siteCookieBanner"][0]{
  _id,
  useCookieBanner,
  consentModal,
  preferencesModal
}`);

/** Document id: `siteAnalyticsSettings` — tracking providers + load mode. */
export const siteAnalyticsSettingsQuery =
	defineQuery(`*[_id == "siteAnalyticsSettings"][0]{
  _id,
  title,
  loadMode,
  trackers[]{
    _key,
    _type,
    enabled,
    cookieFree,
    cookieBannerLabel,
    cookieBannerDescription,
    _type == "trackerGoogleAnalytics" => {
      measurementId
    },
    _type == "trackerMatomo" => {
      url,
      siteId
    },
    _type == "trackerMicrosoftClarity" => {
      projectId
    },
    _type == "trackerPostHog" => {
      apiKey,
      apiHost
    },
    _type == "trackerPlausible" => {
      domain,
      scriptUrl
    }
  }
}`);
