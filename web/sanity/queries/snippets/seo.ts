/**
 * Document field `seo` only (`seo.page` / `seo.fallback`) — embed in page-level queries.
 * The site-wide SEO fallback comes with `siteChromeQuery` (`settings.seo`) and is passed into
 * `metadataFromSanityPageData` (not embedded in per-page queries).
 */
export const pageSeoQuery = `seo {
  title,
  description,
  "imageUrl": image.asset->url
}`;
