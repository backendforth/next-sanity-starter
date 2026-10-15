import { defineQuery } from "next-sanity";

import { blockFields } from "../components/text/richTextMedia";
import { linkQuery } from "./link";
import { imageQuery } from "./media";
import { pageSeoQuery } from "./seo";

/** `internationalizedArrayRichText` entries (`notFoundBody`, …) with resolved `link` marks. */
const intlRichTextBody = `[]{
  _key,
  _type,
  language,
  value[]{
    ${blockFields}
  }
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

/** Document id `siteNav` — main + footer menus with resolved links. */
const siteNavQuery = `*[_type == "siteNav" && _id == "siteNav"][0]{
  "mainMenu": ${navMainMenuQuery},
  "footerMenu": ${navFooterMenuQuery}
}`;

/** Document id `siteCookieBanner` — banner copy for the app shell. */
const siteCookieBannerQuery = `*[_type == "siteCookieBanner" && _id == "siteCookieBanner"][0]{
  consentModal {
    description,
    privacyPolicy{
      ${linkQuery}
    },
    acceptAllBtn,
    acceptNecessaryBtn,
    showPreferencesBtn
  },
  preferencesModal {
    title,
    acceptAllBtn,
    acceptNecessaryBtn,
    savePreferencesBtn,
    sections[]{
      _key,
      title,
      description,
      linkedCategory,
      cookies[]{
        _key,
        name,
        domain,
        description
      }
    }
  }
}`;

/** Document id: `siteLanguageSettings` — the site's locales; the Studio reads it for its language tabs. */
export const siteLanguageSettingsQuery =
	defineQuery(`*[_type == "siteLanguageSettings" && _id == "siteLanguageSettings"][0]{
  availableLanguages[]{id, title},
  defaultLanguageId
}`);

/**
 * `siteSettings` for the shell and route metadata: the brand title, the favicon and the
 * site-wide SEO fallback. The favicon is the raw image field, `crop` and `hotspot` included:
 * the browser icons are derived from it on the Sanity CDN (`siteFaviconIcons`), so cropping
 * the source in the Studio is what makes a wide logo usable at 32 px.
 */
const siteSettingsQuery = `*[_type == "siteSettings" && _id == "siteSettings"][0]{
  title,
  "favicon": favicon${imageQuery},
  ${pageSeoQuery}
}`;

/** Document id: `siteAnalyticsSettings` — the cookie banner switch, load mode and tracking providers. */
const siteAnalyticsSettingsQuery = `*[_type == "siteAnalyticsSettings" && _id == "siteAnalyticsSettings"][0]{
  useCookieBanner,
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

/** Document id: `errorSettings` — the 404 copy. */
const notFoundQuery = `*[_type == "errorSettings" && _id == "errorSettings"][0]{
  notFoundTitle,
  notFoundBody${intlRichTextBody}
}`;

/**
 * Everything around the page in one fetch: nav menus, cookie banner copy, site settings (brand,
 * favicon, SEO fallback), analytics and the 404 copy. The layout, every route's
 * `generateMetadata` and the 404 page all read it, so a render costs this fetch plus the route
 * document's — two `sanityFetch` calls, each a sync-tags probe plus the data request. Live
 * invalidation still works: the bundle's sync tags cover every member document.
 */
export const siteChromeQuery = defineQuery(`{
  "nav": ${siteNavQuery},
  "cookieBanner": ${siteCookieBannerQuery},
  "settings": ${siteSettingsQuery},
  "analytics": ${siteAnalyticsSettingsQuery},
  "notFound": ${notFoundQuery}
}`);
