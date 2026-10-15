import { defineQuery } from "next-sanity";

import { blockFields } from "../components/text/richTextMedia";
import { linkQuery } from "./link";
import { imageQuery } from "./media";

/** Portable Text `body[]` for plain `richText` fields (no embedded modules), `link` marks resolved. */
const richTextBody = `[]{
  ${blockFields}
}`;

/** Main menu: links plus optional `nav.languageSwitch` blocks (order preserved). */
const navMainMenuQuery = `mainMenu[]{
  _key,
  _type,
  _type == "link" => {
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
  ${linkQuery}
}`;

/**
 * `siteNav` for the active locale — main + footer menus with resolved links, no `modules[]`.
 * Falls back to a legacy document with no `language` (pre–document-level i18n) when no
 * locale-specific doc exists.
 */
const siteNavQuery = `coalesce(
  *[_type == "siteNav" && language == $locale][0],
  *[_type == "siteNav" && !defined(language)][0]
){
  _id,
  title,
  language,
  "mainMenu": ${navMainMenuQuery},
  "footerMenu": ${navFooterMenuQuery}
}`;

/** `siteCookieBanner` for the active locale — banner copy for the app shell, no `modules[]`. */
const siteCookieBannerQuery = `*[_type == "siteCookieBanner" && language == $locale][0]{
  _id,
  language,
  useCookieBanner,
  consentModal,
  preferencesModal {
    title,
    acceptAllBtn,
    acceptNecessaryBtn,
    savePreferencesBtn,
    "sections": sections.code
  }
}`;

/** Document id: `siteLanguageSettings` — the global locale registry. */
export const siteLanguageSettingsQuery =
	defineQuery(`*[_type == "siteLanguageSettings" && _id == "siteLanguageSettings"][0]{
  _id,
  availableLanguages[]{id, title},
  defaultLanguageId
}`);

/**
 * `siteSettings` for the shell and route metadata: the brand title, the favicon and the
 * site-wide SEO fallback. The favicon comes from the default language's document on every
 * route: it is the brand's, not a translation. It is the raw image field, `crop` and `hotspot`
 * included: the browser icons are derived from it on the Sanity CDN (`siteFaviconIcons`), so
 * cropping the source in the Studio is what makes a wide logo usable at 32 px.
 */
const siteSettingsQuery = `*[_type == "siteSettings" && language == $locale][0]{
  title,
  "favicon": *[
    _type == "siteSettings" &&
    language == *[_type == "siteLanguageSettings" && _id == "siteLanguageSettings"][0].defaultLanguageId
  ][0].favicon${imageQuery},
  "seo": seo{
    title,
    description,
    "imageUrl": image.asset->url
  }
}`;

/** Document id: `siteAnalyticsSettings` — tracking providers + load mode (global, not per language). */
const siteAnalyticsSettingsQuery = `*[_type == "siteAnalyticsSettings" && _id == "siteAnalyticsSettings"][0]{
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
}`;

/**
 * `errorSettings` for `$locale` — the 404 copy. Its `modules[]` field is deliberately not
 * projected: no error page renders modules, and embedding `modulesQuery` inflated the query from
 * ~2 KB to ~79 KB.
 */
const notFoundQuery = `*[_type == "errorSettings" && language == $locale][0]{
  notFoundTitle,
  "notFoundBody": notFoundBody${richTextBody}
}`;

/**
 * Everything around the page for `$locale` in one fetch: nav menus, cookie banner copy, site
 * settings (brand, favicon, SEO fallback), analytics and the 404 copy. The layout, every
 * route's `generateMetadata` and the 404 pages read it, so a render costs this fetch plus the
 * route document's — two `sanityFetch` calls, each a sync-tags probe plus the data request.
 * Live invalidation still works: the bundle's sync tags cover every member document.
 */
export const siteChromeQuery = defineQuery(`{
  "nav": ${siteNavQuery},
  "cookieBanner": ${siteCookieBannerQuery},
  "settings": ${siteSettingsQuery},
  "analytics": ${siteAnalyticsSettingsQuery},
  "notFound": ${notFoundQuery}
}`);
