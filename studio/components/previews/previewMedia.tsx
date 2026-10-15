import type { SanityImageSource } from "@sanity/image-url";
import {
  type ComponentType,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import type { PreviewProps } from "sanity";

import { urlForImage } from "../../utils/imageUrl";

const fillStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

/**
 * CDN URL for a Sanity image object passed as preview `media` (not a React element), cropped
 * to `width` × `height` — twice the displayed size, for high-density screens.
 */
function previewImageUrl(
  media: PreviewProps["media"],
  width: number,
  height: number,
): string | null {
  if (media == null || typeof media !== "object" || isValidElement(media)) {
    return null;
  }
  try {
    const url = urlForImage
      .image(media as SanityImageSource)
      .width(width)
      .height(height)
      .fit("crop")
      .url();
    return url || null;
  } catch {
    return null;
  }
}

/**
 * Sanity preview `media` (image, URL string, element or icon component) for a frame with
 * `position: relative`: images and elements cover it, an icon is `iconSize` px (center it with
 * the frame's flex alignment). `width` × `height` is the image size requested from the CDN.
 * `null` when there is nothing to show.
 */
export function renderPreviewMedia(
  media: PreviewProps["media"],
  {
    width,
    height,
    iconSize,
  }: { width: number; height: number; iconSize: number },
): ReactNode {
  if (media == null) {
    return null;
  }
  if (isValidElement(media)) {
    const el = media as ReactElement<{ style?: CSSProperties }>;
    return cloneElement(el, {
      style: {
        ...(typeof el.props.style === "object" ? el.props.style : {}),
        ...fillStyle,
      },
    });
  }
  const src =
    typeof media === "string" ? media : previewImageUrl(media, width, height);
  if (src) {
    return <img src={src} alt="" style={fillStyle} />;
  }
  /* A component: `@sanity/icons` are `forwardRef` objects, not functions. */
  if (
    typeof media === "function" ||
    (typeof media === "object" && "$$typeof" in media)
  ) {
    const Icon = media as ComponentType<{ style?: CSSProperties }>;
    return (
      <Icon
        style={{
          width: iconSize,
          height: iconSize,
          opacity: 0.6,
          flexShrink: 0,
        }}
      />
    );
  }
  return null;
}
