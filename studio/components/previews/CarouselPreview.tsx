import type { PreviewProps } from "sanity";

import { renderPreviewMedia } from "./ModuleBlockPreview";

const thumbStyle = {
  width: 56,
  height: 56,
  flexShrink: 0,
  borderRadius: 4,
  overflow: "hidden" as const,
  background: "var(--card-muted-bg-color, rgba(0,0,0,0.06))",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** Compact preview for `module.carousel` in document **modules** arrays (not portable text). */
export function CarouselPreview(props: PreviewProps) {
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
      <div style={thumbStyle}>{renderPreviewMedia(media)}</div>
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
