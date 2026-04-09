import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";

import {
  getResolvedStudioDataset,
  getSanityStudioProjectId,
} from "@/sanity/resolveStudioDataset";
import type { SanityImageField } from "@/sanity/types/modules";

type ImageFit = "clip" | "crop" | "fill" | "fillmax" | "max" | "scale" | "min";
type ImageAuto = "format";
type ImageOrientation = "portrait" | "landscape" | "square" | "unknown";

type BuildImageUrlOptions = {
  width?: number;
  height?: number;
  quality?: number;
  fit?: ImageFit;
  auto?: ImageAuto;
  dpr?: 1 | 2 | 3;
};

const projectId = getSanityStudioProjectId();
const dataset = getResolvedStudioDataset();

const builder = createImageUrlBuilder({ projectId, dataset });

function toSanityImageSource(image: SanityImageField): SanityImageSource | null {
  const id = image?.asset?._id;
  if (!id) {
    return null;
  }

  return {
    _type: "image" as const,
    asset: { _ref: id, _type: "reference" as const },
    crop: image.crop,
    hotspot: image.hotspot,
  } satisfies SanityImageSource;
}

export function getImageDimensions(image: SanityImageField): {
  width?: number;
  height?: number;
  aspectRatio?: number;
} {
  const dims = image?.asset?.metadata?.dimensions;
  return {
    width: dims?.width,
    height: dims?.height,
    aspectRatio: dims?.aspectRatio,
  };
}

export function getImageOrientation(image: SanityImageField): ImageOrientation {
  const { width, height } = getImageDimensions(image);
  if (!width || !height) {
    return "unknown";
  }
  if (width === height) {
    return "square";
  }
  return width > height ? "landscape" : "portrait";
}

export function isPortraitImage(image: SanityImageField): boolean {
  return getImageOrientation(image) === "portrait";
}

export function isLandscapeImage(image: SanityImageField): boolean {
  return getImageOrientation(image) === "landscape";
}

export function getImageAspectRatio(image: SanityImageField, fallback = 16 / 9): number {
  const dims = getImageDimensions(image);
  if (typeof dims.aspectRatio === "number" && Number.isFinite(dims.aspectRatio)) {
    return dims.aspectRatio;
  }
  if (
    typeof dims.width === "number" &&
    typeof dims.height === "number" &&
    dims.height > 0
  ) {
    return dims.width / dims.height;
  }
  return fallback;
}

export function getImageLqip(image: SanityImageField): string | null {
  return image?.asset?.metadata?.lqip ?? null;
}

export function buildFetchedImageUrl(
  image: SanityImageField,
  options: BuildImageUrlOptions = {},
): string | null {
  const source = toSanityImageSource(image);
  if (!source) {
    return image?.asset?.url ?? null;
  }

  let imageBuilder = builder.image(source);

  if (typeof options.width === "number") {
    imageBuilder = imageBuilder.width(options.width);
  }
  if (typeof options.height === "number") {
    imageBuilder = imageBuilder.height(options.height);
  }
  if (typeof options.quality === "number") {
    imageBuilder = imageBuilder.quality(options.quality);
  }
  if (options.fit) {
    imageBuilder = imageBuilder.fit(options.fit);
  }
  if (options.auto) {
    imageBuilder = imageBuilder.auto(options.auto);
  }
  if (options.dpr) {
    imageBuilder = imageBuilder.dpr(options.dpr);
  }

  return imageBuilder.url();
}

export function urlForFetchedImage(image: SanityImageField, width = 1600): string | null {
  return buildFetchedImageUrl(image, {
    width,
    auto: "format",
    quality: 85,
  });
}
