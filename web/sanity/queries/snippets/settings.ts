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
export const siteNavMenusQuery = `*[_id == "siteNav"][0]{
  _id,
  title,
  ${navMenusQuery}
}`;

/** Document id: `siteLanguageSettings` — drives Next routes + `internationalizedArray` codegen in Studio. */
export const siteLanguageSettingsQuery = `*[_id == "siteLanguageSettings"][0]{
  _id,
  availableLanguages[]{id, title},
  defaultLanguageId
}`;

/** Minimal fetch for `app/[locale]/layout.tsx` `generateMetadata` (tab title template). */
export const siteSettingsTitleQuery = `*[_id == "siteSettings"][0]{title}`;

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
 * Single fetch for app shell: settings, nav, errors, cookie banner.
 * Document ids match Studio Documents: siteSettings, siteNav, errorSettings, siteCookieBanner.
 */
export const settingsBundleQuery = `{
  "siteSettings": ${siteSettingsQuery},
  "siteNav": ${siteNavQuery},
  "errorSettings": ${errorSettingsQuery},
  "siteCookieBanner": ${siteCookieBannerQuery}
}`;
