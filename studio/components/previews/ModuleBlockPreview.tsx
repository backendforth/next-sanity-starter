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

/** Resolve CDN URL for Sanity image objects passed as preview `media` (not React elements). */
function previewImageUrl(media: PreviewProps["media"]): string | null {
  if (media == null || typeof media !== "object" || isValidElement(media)) {
    return null;
  }
  try {
    const url = urlForImage
      .image(media as SanityImageSource)
      .width(1600)
      .height(900)
      .fit("crop")
      .url();
    return url || null;
  } catch {
    return null;
  }
}

/** Renders Sanity preview `media` (image ref, URL string, or icon component). */
export function renderPreviewMedia(media: PreviewProps["media"]): ReactNode {
  if (media == null) {
    return null;
  }
  if (isValidElement(media)) {
    return media;
  }
  const objectImageUrl = previewImageUrl(media);
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

  const fromSanityImage = previewImageUrl(media);
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

/**
 * Generic object preview: thumbnail + title + subtitle (fallback for blocks without a custom layout).
 */
export function ModuleBlockPreview(props: PreviewProps) {
  const { title, subtitle, media } = props;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "4px 0",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          flexShrink: 0,
          borderRadius: 4,
          overflow: "hidden",
          background: "var(--card-muted-bg-color, rgba(0,0,0,0.06))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {renderPreviewMedia(media)}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        {title ? (
          <div
            style={{ fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.25 }}
          >
            {typeof title === "string" ? title : String(title)}
          </div>
        ) : null}
        {subtitle ? (
          <div
            style={{
              opacity: 0.75,
              fontSize: "0.75rem",
              marginTop: 2,
              lineHeight: 1.3,
            }}
          >
            {typeof subtitle === "string" ? subtitle : String(subtitle)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
