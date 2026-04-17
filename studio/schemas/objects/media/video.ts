import { PlayIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { MediaVideoPreview } from "../../../components/previews/MediaVideoPreview";
import { getDurationString } from "../../../utils/helpers";

export const mediaVideo = defineType({
  name: "media.video",
  title: "Video (Mux)",
  type: "object",
  icon: PlayIcon,
  fields: [
    {
      title: "Video file",
      name: "video",
      type: "mux.video",
      /** Required when this object is used as the active video block; enforced on `module.media` / callers, not here (hidden field + `enforce-required-fields`). */
    },
    {
      name: "poster",
      title: "Poster image",
      type: "image",
      description: "Displayed before playback and as fallback.",
      options: { hotspot: true },
    },
    {
      name: "videoSettings",
      title: "Video player settings",
      type: "object",
      fields: [
        {
          type: "boolean",
          name: "autoplay",
          title: "Autoplay",
          description: "Autoplay videos are muted in most browsers.",
          initialValue: false,
        },
        {
          type: "boolean",
          name: "controls",
          title: "Controls",
          initialValue: true,
        },
      ],
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
        ? `${durationString} (${videoWidth}px × ${videoHeight}px)`
        : durationString || undefined;
      return {
        title:
          typeof caption === "string" && caption.trim() ? caption : "Video",
        subtitle,
        media: poster ?? PlayIcon,
      };
    },
  },
});
