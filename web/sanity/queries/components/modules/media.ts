import { imageQuery, videoQuery } from "../../snippets/media";

/**
 * `resolvedMedia` for `module.media`, also per carousel slide.
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
      "media": videoLoopContent.video${videoQuery},
      "poster": videoLoopContent.poster${imageQuery}
    },
    type == "video" => {
      "kind": "video",
      "caption": videoContent.caption,
      "videoSettings": videoContent.videoSettings,
      "media": videoContent.video${videoQuery},
      "poster": videoContent.poster${imageQuery}
    },
    {
      "kind": "image",
      "caption": imageContent.caption,
      "media": imageContent.image${imageQuery}
    }
  )
`;

/** `module.media` (`objects/modules/moduleMedia.ts`): the renderer reads `resolvedMedia` alone. */
export const moduleMediaQuery = `_type == "module.media" => {
  "resolvedMedia": ${moduleMediaResolvedMediaQuery}
}`;
