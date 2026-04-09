import type { IntlStringEntry } from "@/sanity/utils";
import type { ModuleMediaData, ResolvedMediaPayload } from "./media";

export type ModuleCarouselData = {
  _type: "module.carousel";
  _key?: string;
  heading?: IntlStringEntry[] | null;
  imagesOnly?: boolean | null;
  /** Bild-Slides: je Slide `media` aus `mediaQuery` (kind + Daten). */
  slides?: Array<{
    _key?: string;
    _type?: string;
    media?: ResolvedMediaPayload | null;
  }> | null;
  slidesMedia?: Array<ModuleMediaData> | null;
  resolvedSlides?:
    | Array<{
        _key?: string;
        _type?: string;
        media?: ResolvedMediaPayload | null;
        resolvedMedia?: ModuleMediaData["resolvedMedia"];
      }>
    | null;
};
