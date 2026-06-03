import { mediaQuery } from "../../snippets/media";
import { moduleMediaInnerFields, moduleMediaResolvedMediaQuery } from "./media";

/**
 * `module.carousel` (`objects/modules/moduleCarousel.ts`):
 * `imagesOnly` → `slides` (plain `image` items); otherwise `slidesMedia` (`module.media` = image or video).
 */
export const moduleCarouselInnerFields = `
  heading,
  imagesOnly,
  loop,
  showThumbnails,
  showNavDots,
  multipleSlides,
  autoplay,
  autoplayDelayMs,
  "slides": slides[]{
    _key,
    _type,
    "media": ${mediaQuery}
  },
  "slidesMedia": slidesMedia[]{
    _key,
    _type,
    ${moduleMediaInnerFields}
  },
  "resolvedSlides": select(
    imagesOnly == true => slides[]{
      _key,
      _type,
      "media": ${mediaQuery}
    },
    slidesMedia[]{
      _key,
      _type,
      "resolvedMedia": ${moduleMediaResolvedMediaQuery}
    }
  )
`;

export const moduleCarouselQuery = `_type == "module.carousel" => {
  ${moduleCarouselInnerFields}
}`;
