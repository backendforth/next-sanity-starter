/**
 * Editor hint for every field that takes an image upload (images, video
 * posters, carousel slides).
 *
 * Sanity re-encodes uploads and strips their metadata, but it applies an
 * embedded ICC profile first: a Display P3 master comes out as correct sRGB
 * (measured 2026-08). A file WITHOUT a profile is assumed to be sRGB already
 * and passes through unconverted, so wide-gamut pixel data then renders with
 * visibly less saturation. Nothing to fix in code; the export has to be tagged.
 */
export const IMAGE_COLOR_PROFILE_HINT =
  "Export with an embedded color profile, ideally sRGB (Display P3 is converted correctly). Files without a profile are treated as sRGB, so wide-gamut exports can look washed out on the site.";
