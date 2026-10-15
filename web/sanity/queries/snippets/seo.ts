import { imageQuery } from "./media";

/**
 * Document field `seo` only (`seo.page` / `seo.fallback`) — embed in page-level queries.
 * The site-wide SEO fallback comes with `siteChromeQuery` (`settings.seo`) and is passed into
 * `metadataFromSanityPageData` (not embedded in per-page queries).
 *
 * `title` / `description` are `internationalizedArray*` and project as full
 * arrays — `metadataFromSanityPageData` picks the locale. `image` keeps crop and hotspot: the
 * share image is cut to 1200 × 630 from it.
 */
export const pageSeoQuery = `seo {
  title,
  description,
  image${imageQuery}
}`;
