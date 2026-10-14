import { defineQuery } from "next-sanity";

import { blockFields } from "../components/text/richTextMedia";
import { linkQuery } from "./link";
import { imageQuery } from "./media";

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

/** Document id `siteNav` — main + footer menus with resolved links, no `modules[]`. */
const siteNavQuery = `*[_type == "siteNav" && _id == "siteNav"][0]{
  _id,
  title,
  "mainMenu": ${navMainMenuQuery},
  "footerMenu": ${navFooterMenuQuery}
}`;

/** Document id `siteCookieBanner` — banner copy for the app shell, no `modules[]`. */
const siteCookieBannerQuery = `*[_type == "siteCookieBanner" && _id == "siteCookieBanner"][0]{
  _id,
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

/** Document id: `siteLanguageSettings` — drives Next routes + `internationalizedArray` codegen in Studio. */
export const siteLanguageSettingsQuery =
	defineQuery(`*[_type == "siteLanguageSettings" && _id == "siteLanguageSettings"][0]{
  _id,
  availableLanguages[]{id, title},
  defaultLanguageId
}`);

/** Minimal fetch for `app/[locale]/layout.tsx` `generateMetadata` (tab title template). */
export const siteSettingsTitleQuery = defineQuery(
	`*[_type == "siteSettings" && _id == "siteSettings"][0]{title}`,
);

/**
 * `siteSettings.favicon` — the raw image field, `crop` and `hotspot` included:
 * the browser icons are derived from it on the Sanity CDN (`siteFaviconIcons`),
 * so whatever an editor uploads is squared and resized on the fly. Cropping
 * the source in the Studio is what makes a wide logo usable at 32 px, which is
 * why those two fields have to travel with the asset.
 */
export const siteSettingsFaviconQuery =
	defineQuery(`*[_type == "siteSettings" && _id == "siteSettings"][0]{
  "favicon": favicon${imageQuery}
}`);

/** Site-wide SEO fallback for route `generateMetadata` (deduped via `fetchSettingsSeoFallback`). */
export const siteSettingsSeoFallbackQuery =
	defineQuery(`*[_type == "siteSettings" && _id == "siteSettings"][0]{
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
export const errorSettingsQuery =
	defineQuery(`*[_type == "errorSettings" && _id == "errorSettings"][0]{
  _id,
  notFoundTitle,
  notFoundBody${intlRichTextBody},
  serverErrorTitle,
  serverErrorBody${intlRichTextBody}
}`);

/**
 * App shell for `app/[locale]/layout.tsx` in one fetch: nav menus, cookie banner copy and the
 * site title. Each `sanityFetch` is two roundtrips (sync-tags probe + data), so three separate
 * fetches cost six requests per uncached render, the bundle two. Live invalidation still works:
 * the bundle's sync tags cover every member document. `siteAnalyticsSettings` stays separate,
 * it is fetched with `stega: false`.
 */
export const siteChromeQuery = defineQuery(`{
  "nav": ${siteNavQuery},
  "cookieBanner": ${siteCookieBannerQuery},
  "title": *[_type == "siteSettings" && _id == "siteSettings"][0].title
}`);

/** Document id: `siteAnalyticsSettings` — tracking providers + load mode. */
export const siteAnalyticsSettingsQuery =
	defineQuery(`*[_type == "siteAnalyticsSettings" && _id == "siteAnalyticsSettings"][0]{
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
