import { modulesQuery } from "../components/modules";
import { linkQuery } from "./link";
import { imageQuery } from "./media";
import { seoQuery } from "./seo";

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

/** Main + footer link lists with resolved `link` objects (`internal` / `external` / `function`). */
export const navMenusQuery = `
  "mainMenu": mainMenu[]{
    _key,
    _type,
    ${linkQuery}
  },
  "footerMenu": footerMenu[]{
    _key,
    _type,
    ${linkQuery}
  }
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

/** Document id: `siteSettings`. */
export const siteSettingsQuery = `*[_id == "siteSettings"][0]{
  _id,
  title,
  "favicon": favicon${imageQuery},
  ${modulesQuery},
  ${seoQuery}
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
