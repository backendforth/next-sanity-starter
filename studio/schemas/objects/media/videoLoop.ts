import { PlayIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { MediaVideoPreview } from "../../../components/previews/MediaVideoPreview";
import { getDurationString } from "../../../utils/helpers";

/**
 * Silent Mux video loop — separate from `media.video` because the editor intent is
 * different: no controls, no play button, no autoplay toggle. The clip just plays in the
 * background. The only knob besides the asset itself is `allowUnmute`, which surfaces a
 * small speaker control in the rendered loop.
 *
 * Renders via `<MediaVideoLoop>` (native `<video>` + hls.js), not `<MuxPlayer>` — the full
 * player chrome would be wasted on a hero background or decorative motion.
 */
export const mediaVideoLoop = defineType({
  name: "media.videoLoop",
  title: "Video loop (Mux)",
  type: "object",
  icon: PlayIcon,
  fields: [
    {
      title: "Video file",
      name: "video",
      type: "mux.video",
      /** Required when this object is used as the active loop block; enforced on `module.media` / callers, not here (hidden field + `enforce-required-fields`). */
    },
    {
      name: "poster",
      title: "Poster image",
      type: "image",
      description: "Shown before the first frame is decoded and as fallback.",
      options: { hotspot: true },
    },
    {
      type: "boolean",
      name: "allowUnmute",
      title: "Allow unmute",
      description:
        "Shows a small speaker button so visitors can turn sound on. The loop still starts muted.",
      initialValue: false,
    },
    {
      name: "caption",
      title: "Caption",
      type: "string",
    },
  ],
  components: {
    preview: MediaVideoPreview,
  },
  preview: {
    select: {
      poster: "poster",
      tracks: "video.asset.data.tracks",
      duration: "video.asset.data.duration",
      caption: "caption",
    },
    prepare(selection) {
      const { tracks, duration, caption, poster } = selection;
      const durationString = getDurationString(
        typeof duration === "number" ? duration : undefined,
      );
      const videoTrack = Array.isArray(tracks)
        ? tracks.find((el: { type?: string }) => el?.type === "video")
        : undefined;
      const videoWidth = videoTrack
        ? (videoTrack as { max_width?: number }).max_width
        : undefined;
      const videoHeight = videoTrack
        ? (videoTrack as { max_height?: number }).max_height
        : undefined;
      const subtitle = videoTrack
        ? `Loop · ${durationString} (${videoWidth}px × ${videoHeight}px)`
        : `Loop${durationString ? ` · ${durationString}` : ""}`;
      return {
        title:
          typeof caption === "string" && caption.trim()
            ? caption
            : "Video loop",
        subtitle,
        media: poster ?? PlayIcon,
      };
    },
  },
});
