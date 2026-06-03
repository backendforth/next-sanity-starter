import { imageQuery, mediaQuerySpread } from "../../snippets/media";

/**
 * `resolvedMedia` for `module.media` — same logic as the projection; for carousel, `resolvedSlides`.
 *
 * Three kinds: `image`, `video` (full MuxPlayer with controls), `loop` (silent native
 * `<video>` background loop with optional unmute toggle).
 */
export const moduleMediaResolvedMediaQuery = `
  select(
    type == "loop" => {
      "kind": "loop",
      "caption": videoLoopContent.caption,
      "allowUnmute": videoLoopContent.allowUnmute,
      "media": videoLoopContent.video{ ${mediaQuerySpread} },
      "poster": videoLoopContent.poster${imageQuery}
    },
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
 * `module.media` (`objects/modules/moduleMedia.ts`) — image/video/loop via `mediaQuery` on each asset field.
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
  videoLoopContent{
    caption,
    allowUnmute,
    "media": video{ ${mediaQuerySpread} },
    "poster": poster${imageQuery}
  },
  "resolvedMedia": ${moduleMediaResolvedMediaQuery}
`;

export const moduleMediaQuery = `_type == "module.media" => {
  ${moduleMediaInnerFields}
}`;
