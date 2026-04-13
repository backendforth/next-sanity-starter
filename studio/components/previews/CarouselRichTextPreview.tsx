import type { CSSProperties } from "react";
import type { PreviewProps } from "sanity";

import { RichTextBlockMediaArea } from "./ModuleBlockPreview";

const COMPONENT_TITLE = "Carousel";

const blockShell: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  borderRadius: 6,
  border: "1px solid rgba(0, 0, 0, 0.08)",
  overflow: "hidden",
};

const titleBarStyle: CSSProperties = {
  padding: "7px 10px",
  fontSize: "0.7rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  opacity: 0.88,
  borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
  background: "var(--card-muted-bg-color, rgba(0,0,0,0.05))",
};

/** `module.carousel` preview in portable text: title bar → 16:9 first slide → slide count. */
export function CarouselRichTextPreview(props: PreviewProps) {
  const { subtitle, media } = props;

  return (
    <div style={blockShell}>
      <div style={titleBarStyle}>{COMPONENT_TITLE}</div>
      <RichTextBlockMediaArea media={media} />
      {subtitle ? (
        <div
          style={{
            padding: "8px 10px 10px",
            minWidth: 0,
            fontSize: "0.75rem",
            lineHeight: 1.35,
            opacity: 0.82,
          }}
        >
          {typeof subtitle === "string" ? subtitle : String(subtitle)}
        </div>
      ) : null}
    </div>
  );
}
