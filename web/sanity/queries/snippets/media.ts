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
      dimensions{ width, height, aspectRatio },
      lqip
    }
  }
`;

export const imageQuery = `{${imageShapeQuery}}`;

/**
 * Mux / `mux.video` field: use as `fieldName${videoQuery}`.
 */
export const videoQuery = `{
  "playbackId": coalesce(
    asset->playbackId,
    asset->data.playbackId,
    asset->data.playback_ids[0].id
  ),
  "duration": asset->data.duration,
  "asset": asset->{
    playbackId,
    data
  }
}`;

/**
 * Field whose root has an `asset` (Sanity `image` or Mux video): picks image vs video from `asset`.
 *
 * - As a **value** after a key: `"media": ${mediaQuery}` (bare `select` is valid here).
 * - **Inside** a field projection `image{ … }` / `video{ … }`: use only `…${mediaQuerySpread}` —
 *   a standalone `{ select(…) }` is invalid in GROQ object projections (parser:
 *   "Attribute or a string key expected"); spread fixes that.
 */
export const mediaQuery = `select(
  defined(asset->playbackId) || defined(asset->data.playbackId) => {
    "kind": "video",
    ...${videoQuery}
  },
  {
    "kind": "image",
    ...${imageQuery}
  }
)`;

/** For `image{ ${mediaQuerySpread} }` / `video{ ${mediaQuerySpread} }` — see `mediaQuery`. */
export const mediaQuerySpread = `...${mediaQuery}`;
