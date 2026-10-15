import { imageQuery } from "../../snippets/media";
import { moduleMediaResolvedMediaQuery } from "./media";

/**
 * `module.carousel` (`objects/modules/moduleCarousel.ts`): `resolvedSlides` holds `slides`
 * (plain `image` items) when `imagesOnly` is on, otherwise `slidesMedia` (`module.media` =
 * image or video). An unset `imagesOnly` counts as on, like in the Studio, which shows `slides`
 * until it is switched off. Only the resolved list is projected; the renderer reads nothing else.
 */
export const moduleCarouselQuery = `_type == "module.carousel" => {
  heading,
  loop,
  showThumbnails,
  showNavDots,
  multipleSlides,
  autoplay,
  autoplayDelayMs,
  "resolvedSlides": select(
    imagesOnly != false => slides[]{
      _key,
      _type,
      "media": @${imageQuery}
    },
    slidesMedia[]{
      _key,
      _type,
      "resolvedMedia": ${moduleMediaResolvedMediaQuery}
    }
  )
}`;
