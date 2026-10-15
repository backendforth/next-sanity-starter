import { imageQuery, mediaQuerySpread } from "../../snippets/media";

/**
 * `resolvedMedia` for `module.media`, and per slide in the carousel's `resolvedSlides`.
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
 * `module.media` (`objects/modules/moduleMedia.ts`): only the resolved shape. The raw
 * `imageContent` / `videoContent` / `videoLoopContent` objects are not projected, the renderer
 * reads `resolvedMedia` alone.
 */
export const moduleMediaInnerFields = `
  "resolvedMedia": ${moduleMediaResolvedMediaQuery}
`;

export const moduleMediaQuery = `_type == "module.media" => {
  ${moduleMediaInnerFields}
}`;
