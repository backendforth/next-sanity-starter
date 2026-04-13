import type { CSSProperties } from "react";
import type { PreviewProps } from "sanity";

import { RichTextBlockMediaArea } from "./ModuleBlockPreview";

/** Matches `defineType` title for `module.media`. */
const COMPONENT_TITLE = "Media";

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

/** `module.media` preview in portable text: component title bar → 16:9 image → optional meta. */
export function MediaRichTextPreview(props: PreviewProps) {
  const { title, subtitle, media } = props;

  return (
    <div style={blockShell}>
      <div style={titleBarStyle}>{COMPONENT_TITLE}</div>
      <RichTextBlockMediaArea media={media} />
      {title || subtitle ? (
        <div
          style={{
            padding: "8px 10px 10px",
            minWidth: 0,
            fontSize: "0.75rem",
            lineHeight: 1.35,
            opacity: 0.82,
          }}
        >
          {title ? (
            <div style={{ fontWeight: 600, marginBottom: subtitle ? 4 : 0 }}>
              {typeof title === "string" ? title : String(title)}
            </div>
          ) : null}
          {subtitle ? (
            <div style={{ opacity: 0.85 }}>
              {typeof subtitle === "string" ? subtitle : String(subtitle)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
