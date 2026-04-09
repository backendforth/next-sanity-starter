import { mediaQuery } from "../../snippets/media";
import { moduleMediaInnerFields, moduleMediaResolvedMediaQuery } from "./media";

/**
 * `module.carousel` (`objects/modules/carousel.ts`):
 * `imagesOnly` → `slides` (reine `image`-Items); sonst `slidesMedia` (`module.media` = Bild oder Video).
 */
export const moduleCarouselInnerFields = `
  heading,
  imagesOnly,
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
