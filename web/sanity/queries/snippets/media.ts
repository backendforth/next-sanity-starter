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
 * Ein Feld, dessen Wurzel ein `asset` hat (Sanity-`image` oder Mux-Video): erkennt automatisch
 * Video vs. Bild an `asset`. Im Projektionskontext des Feldes verwenden, z. B.:
 * `"media": image{ ${mediaQuery} }` oder für ein reines `image`-Slide: `"media": ${mediaQuery}`.
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
