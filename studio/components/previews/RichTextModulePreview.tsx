import type { CSSProperties } from "react";
import type { PreviewProps } from "sanity";

import { renderPreviewMedia } from "./previewMedia";

const blockShell: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  borderRadius: 6,
  border: "1px solid rgba(0, 0, 0, 0.08)",
  overflow: "hidden",
};

/** 16:9 and as wide as the rich-text block (not the Studio window). */
const mediaFrameStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--card-muted-bg-color, rgba(0,0,0,0.07))",
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

/**
 * A module's preview inside portable text: title bar with the component name (its `defineType`
 * title) → 16:9 media → optional meta. `showTitle: false` (carousel) shows only the subtitle.
 */
export function richTextModulePreview(
  componentTitle: string,
  { showTitle }: { showTitle: boolean },
) {
  return function RichTextModulePreview(props: PreviewProps) {
    const { subtitle, media } = props;
    const title = showTitle ? props.title : undefined;
    const subtitleText =
      typeof subtitle === "string" ? subtitle : String(subtitle);
    const mediaNode = renderPreviewMedia(media, {
      width: 1600,
      height: 900,
      iconSize: 48,
    });

    return (
      <div style={blockShell}>
        <div style={titleBarStyle}>{componentTitle}</div>
        {mediaNode ? <div style={mediaFrameStyle}>{mediaNode}</div> : null}
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
              showTitle ? (
                <div style={{ opacity: 0.85 }}>{subtitleText}</div>
              ) : (
                subtitleText
              )
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };
}
