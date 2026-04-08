import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";

import type { SanityImageField } from "@/sanity/types/modules";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? "";
const dataset = process.env.SANITY_STUDIO_DATASET_PRODUCTION ?? "";

const builder = createImageUrlBuilder({ projectId, dataset });

/**
 * Builds a CDN URL for a fetched Sanity `image` field (with optional crop / hotspot).
 */
export function urlForFetchedImage(image: SanityImageField, width = 1600): string | null {
  const id = image?.asset?._id;
  if (!id) return null;

  const source = {
    _type: "image" as const,
    asset: { _ref: id, _type: "reference" as const },
    crop: image.crop,
    hotspot: image.hotspot,
  } satisfies SanityImageSource;

  return builder.image(source).width(width).auto("format").quality(85).url();
}
