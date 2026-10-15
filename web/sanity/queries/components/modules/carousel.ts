import { moduleMediaResolvedMediaQuery } from "./media";

/**
 * `module.carousel` (`objects/modules/moduleCarousel.ts`): every slide is a `module.media`,
 * projected to the same `resolvedMedia` as the media module.
 */
export const moduleCarouselQuery = `_type == "module.carousel" => {
  heading,
  loop,
  showThumbnails,
  showNavDots,
  multipleSlides,
  autoplay,
  autoplayDelayMs,
  slides[]{
    _key,
    "resolvedMedia": ${moduleMediaResolvedMediaQuery}
  }
}`;
