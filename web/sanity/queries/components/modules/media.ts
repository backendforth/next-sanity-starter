import { imageQuery, mediaQuery, videoQuery } from "../../snippets/media";

/**
 * `resolvedMedia` für `module.media` — gleiche Logik wie in der Projektion, für Carousel `resolvedSlides`.
 */
export const moduleMediaResolvedMediaQuery = `
  select(
    type == "video" => {
      "kind": "video",
      "caption": videoContent.caption,
      "videoSettings": videoContent.videoSettings,
      "media": videoContent.video{ ${mediaQuery} },
      "poster": videoContent.poster${imageQuery}
    },
    {
      "kind": "image",
      "caption": imageContent.caption,
      "media": imageContent.image{ ${mediaQuery} }
    }
  )
`;

/**
 * `module.media` (`objects/modules/media.ts`) — Bild/Video über `mediaQuery` am jeweiligen Asset-Feld.
 */
export const moduleMediaInnerFields = `
  type,
  imageContent{
    caption,
    "media": image{ ${mediaQuery} }
  },
  videoContent{
    caption,
    videoSettings,
    "media": video{ ${mediaQuery} },
    "poster": poster${imageQuery}
  },
  "resolvedMedia": ${moduleMediaResolvedMediaQuery}
`;

export const moduleMediaQuery = `_type == "module.media" => {
  ${moduleMediaInnerFields}
}`;
