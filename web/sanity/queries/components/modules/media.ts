import { imageQuery, mediaQuerySpread } from "../../snippets/media";

/**
 * `resolvedMedia` for `module.media` — same logic as the projection; for carousel, `resolvedSlides`.
 */
export const moduleMediaResolvedMediaQuery = `
  select(
    type == "video" => {
      "kind": "video",
      "caption": videoContent.caption,
      "videoSettings": videoContent.videoSettings,
      "media": videoContent.video{ ${mediaQuerySpread} },
      "poster": videoContent.poster${imageQuery}
    },
    {
      "kind": "image",
      "caption": imageContent.caption,
      "media": imageContent.image{ ${mediaQuerySpread} }
    }
  )
`;

/**
 * `module.media` (`objects/modules/media.ts`) — image/video via `mediaQuery` on each asset field.
 */
export const moduleMediaInnerFields = `
  type,
  imageContent{
    caption,
    "media": image{ ${mediaQuerySpread} }
  },
  videoContent{
    caption,
    videoSettings,
    "media": video{ ${mediaQuerySpread} },
    "poster": poster${imageQuery}
  },
  "resolvedMedia": ${moduleMediaResolvedMediaQuery}
`;

export const moduleMediaQuery = `_type == "module.media" => {
  ${moduleMediaInnerFields}
}`;
