/**
 * Image field (`image` type): use as `fieldName${imageQuery}` → `fieldName{ crop, hotspot, … }`.
 */
export const imageShapeQuery = `
  crop,
  hotspot,
  "alt": asset->altText,
  "asset": asset->{
    _id,
    url,
    metadata{
      dimensions{ width, height, aspectRatio }
    }
  }
`;

export const imageQuery = `{${imageShapeQuery}}`;

/**
 * Mux / `mux.video` field: use as `fieldName${videoQuery}`.
 *
 * `thumbTime` is the poster frame picked in Studio (`muxThumbnailTimeSec`). `data` is trimmed
 * to the video track size `muxImage.ts` reads; the full Mux asset payload (renditions, static
 * files, input info) is several KB per video.
 */
export const videoQuery = `{
  "playbackId": coalesce(asset->playbackId, asset->data.playback_ids[0].id),
  "asset": asset->{
    thumbTime,
    "data": data{ "tracks": tracks[]{ type, max_width, max_height } }
  }
}`;
