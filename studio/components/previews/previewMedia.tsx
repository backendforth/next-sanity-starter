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

const richTextMediaFrameStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  aspectRatio: "16 / 9",
  position: "relative",
  overflow: "hidden",
  background: "var(--card-muted-bg-color, rgba(0,0,0,0.07))",
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

/** Renders Sanity preview `media` (image ref, URL string, or icon component) for a 56 px thumbnail. */
export function renderPreviewMedia(media: PreviewProps["media"]): ReactNode {
  if (media == null) {
    return null;
  }
  if (isValidElement(media)) {
    return media;
  }
  const objectImageUrl = previewImageUrl(media, 112, 112);
  if (objectImageUrl) {
    return (
      <img
        src={objectImageUrl}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }
  if (typeof media === "function") {
    const Icon = media as ComponentType<{ style?: CSSProperties }>;
    return (
      <Icon
        style={{
          width: 28,
          height: 28,
          opacity: 0.65,
          flexShrink: 0,
        }}
      />
    );
  }
  if (typeof media === "string") {
    return (
      <img
        src={media}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }
  return null;
}

/**
 * 16:9 preview area as wide as the rich-text block (not the Studio window).
 * Placeholder icons are centered; images fill the frame.
 */
export function RichTextBlockMediaArea({
  media,
}: {
  media: PreviewProps["media"];
}) {
  if (media == null) {
    return null;
  }

  const fromSanityImage = previewImageUrl(media, 1600, 900);
  if (typeof fromSanityImage === "string" && fromSanityImage.length > 0) {
    return (
      <div style={richTextMediaFrameStyle}>
        <img
          src={fromSanityImage}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  }

  if (typeof media === "function") {
    const Icon = media as ComponentType<{ style?: CSSProperties }>;
    return (
      <div
        style={{
          ...richTextMediaFrameStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon style={{ width: 48, height: 48, opacity: 0.5, flexShrink: 0 }} />
      </div>
    );
  }
  if (typeof media === "string") {
    return (
      <div style={richTextMediaFrameStyle}>
        <img
          src={media}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    );
  }
  if (isValidElement(media)) {
    const el = media as ReactElement<{ style?: CSSProperties }>;
    return (
      <div style={richTextMediaFrameStyle}>
        {cloneElement(el, {
          style: {
            ...(typeof el.props.style === "object" ? el.props.style : {}),
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          },
        })}
      </div>
    );
  }
  return null;
}
