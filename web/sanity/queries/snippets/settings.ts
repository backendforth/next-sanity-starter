import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { linkQuery } from "./link";
import { imageQuery } from "./media";
import { pageSeoQuery } from "./seo";

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

/** Document id: `siteNav` (see studio structure). */
export const siteNavQuery = `*[_id == "siteNav"][0]{
  _id,
  title,
  ${navMenusQuery},
  ${modulesQuery}
}`;

/** Same resolved menus as `siteNavQuery` without `modules[]` (lighter layout fetch). */
/**
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

/** Document id: `siteSettings`. */
export const siteSettingsQuery = `*[_id == "siteSettings"][0]{
  _id,
  title,
  "favicon": favicon${imageQuery},
  ${modulesQuery},
  ${pageSeoQuery}
}`;

/** Document id: `errorSettings`. */
export const errorSettingsQuery = `*[_id == "errorSettings"][0]{
  _id,
  notFoundTitle,
  ${internationalizedRichTextArrayField("notFoundBody")},
  serverErrorTitle,
  ${internationalizedRichTextArrayField("serverErrorBody")},
  ${modulesQuery}
}`;

/** Document id: `siteCookieBanner`. */
export const siteCookieBannerQuery = `*[_id == "siteCookieBanner"][0]{
  _id,
  title,
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
	defineQuery(`*[_id == "siteCookieBanner"][0]{
  _id,
  useCookieBanner,
  consentModal,
  preferencesModal
}`);

/**
 * Single fetch for app shell: settings, nav, errors, cookie banner.
 * Document ids match Studio Documents: siteSettings, siteNav, errorSettings, siteCookieBanner.
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
