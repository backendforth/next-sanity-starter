/**
 * Document field `seo` only (`seo.page` / `seo.fallback`) — e.g. **`siteSettingsQuery`**.
 * Site-wide SEO fallback for routes is fetched once via **`siteSettingsSeoFallbackQuery`**
 * and passed into `metadataFromSanityPageData` (not embedded in per-page queries).
 */
export const pageSeoQuery = `seo {
  title,
  description,
  "imageUrl": image.asset->url
}`;
