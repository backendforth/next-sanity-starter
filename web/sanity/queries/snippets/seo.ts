/**
 * Document field `seo` only (`seo.page` / `seo.fallback`) — e.g. **`siteSettingsQuery`**.
 * For route queries (home / `page`), use **`seoQuery`** which adds the settings fallback join.
 */
export const pageSeoQuery = `seo {
  title,
  description,
  "imageUrl": image.asset->url
}`;

const globalSeoFields = `
  "title": seo.title,
  "description": seo.description,
  "imageUrl": seo.image.asset->url
`;

/**
 * **Home** and **`page` documents:** `data.seo` plus `data.settingsSeo` from `siteSettings`
 * for `resolveSanityMetadata` when the page has no local SEO.
 */
export const seoQuery = `
  ${pageSeoQuery},
  "settingsSeo": *[_id == "siteSettings"][0]{
    ${globalSeoFields}
  }
`;
