import { ImageIcon, PlayIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { MediaPreview } from "../../../components/previews/MediaPreview";
import { getDurationString } from "../../../utils/helpers";

export const moduleMedia = defineType({
  title: "Media",
  name: "module.media",
  type: "object",
  icon: ImageIcon,
  fields: [
    {
      name: "type",
      title: "Type",
      type: "string",
      initialValue: "image",
      options: {
        list: [
          { title: "Image", value: "image" },
          { title: "Video", value: "video" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (rule) => rule.required(),
    },
    {
      title: "Video file",
      name: "video",
      type: "mux.video",
      hidden: ({ parent }) => parent?.type !== "video",
      validation: (rule) =>
        rule.custom((field, context) => {
          const parent = context.parent as { type?: string } | undefined;
          if (parent?.type === "video" && !field) {
            return "Video is required.";
          }
          return true;
        }),
    },
    {
      name: "image",
      title: "Image",
      type: "image",
      description:
        "When type is video, this image is used as the poster / fallback.",
      options: { hotspot: true },
      validation: (rule) =>
        rule.custom((field, context) => {
          const parent = context.parent as { type?: string } | undefined;
          if (parent?.type === "image" && !field) {
            return "Image is required.";
          }
          return true;
        }),
    },
    {
      name: "videoSettings",
      title: "Video player settings",
      type: "object",
      hidden: ({ parent }) => parent?.type !== "video",
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
    preview: MediaPreview,
  },
  preview: {
    select: {
      type: "type",
      image: "image",
      poster: "image.asset",
      filename: "image.asset.originalFilename",
      dimensions: "image.asset.metadata.dimensions",
      tracks: "video.asset.data.tracks",
      duration: "video.asset.data.duration",
    },
    prepare(selection) {
      const { type, image, filename, dimensions, tracks, duration } = selection;

      const title =
        typeof type === "string"
          ? type.charAt(0).toUpperCase() + type.slice(1)
          : "Media";

      const isVideo = type === "video";
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

      let subtitle: string | undefined;

      if (isVideo) {
        subtitle = videoTrack
          ? `${durationString} (${videoWidth}px × ${videoHeight}px)`
          : durationString || undefined;
      } else {
        subtitle =
          dimensions && filename
            ? `${filename} (${dimensions.width}px × ${dimensions.height}px)`
            : undefined;
      }

      return {
        title,
        subtitle,
        media: isVideo ? PlayIcon : image ? image : ImageIcon,
      };
    },
  },
});
