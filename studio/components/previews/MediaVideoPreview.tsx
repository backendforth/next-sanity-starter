import type { PreviewProps } from "sanity";

/**
 * Object preview for `media.video` (Mux).
 */
export function MediaVideoPreview(props: PreviewProps) {
  const { title, subtitle } = props;

  return (
    <div style={{ padding: "0.25rem 0" }}>
      {title ? (
        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
          {typeof title === "string" ? title : String(title)}
        </div>
      ) : null}
      {subtitle ? (
        <div style={{ opacity: 0.75, fontSize: "0.75rem", marginTop: 4 }}>
          {typeof subtitle === "string" ? subtitle : String(subtitle)}
        </div>
      ) : null}
    </div>
  );
}
