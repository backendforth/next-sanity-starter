import { ImageIcon, PlayIcon } from "@sanity/icons";
import { defineType, type PreviewValue } from "sanity";

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
      name: "imageContent",
      title: "Image",
      type: "media.image",
      hidden: ({ parent }) => parent?.type !== "image",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          if (parent?.type !== "image") {
            return true;
          }
          const row = value as { image?: { asset?: unknown } } | undefined;
          if (!row?.image?.asset) {
            return "Add an image.";
          }
          return true;
        }),
    },
    {
      name: "videoContent",
      title: "Video",
      type: "media.video",
      hidden: ({ parent }) => parent?.type !== "video",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          if (parent?.type !== "video") {
            return true;
          }
          const row = value as
            | { video?: { asset?: unknown } | null }
            | undefined;
          const mux = row?.video;
          const hasAsset =
            mux != null &&
            typeof mux === "object" &&
            mux !== null &&
            "asset" in mux &&
            (mux as { asset?: unknown }).asset != null;
          if (!hasAsset) {
            return "Add a video.";
          }
          return true;
        }),
    },
  ],
  preview: {
    select: {
      type: "type",
      image: "imageContent.image",
      filename: "imageContent.image.asset.originalFilename",
      dimensions: "imageContent.image.asset.metadata.dimensions",
      poster: "videoContent.poster",
      tracks: "videoContent.video.asset.data.tracks",
      duration: "videoContent.video.asset.data.duration",
    },
    prepare(selection) {
      const { type, image, filename, dimensions, poster, tracks, duration } =
        selection;

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

      /** Main line: filename (image) or “Video”. Kicker “Media” is rendered in `MediaPreview`. */
      let mainTitle: string;
      if (isVideo) {
        mainTitle = "Video";
      } else if (filename && String(filename).trim()) {
        mainTitle = String(filename);
      } else {
        mainTitle = "Image";
      }

      let subtitle: string | undefined;
      if (isVideo) {
        subtitle = videoTrack
          ? `${durationString} · ${videoWidth}px × ${videoHeight}px`
          : durationString || undefined;
      } else if (dimensions && filename) {
        subtitle = `${dimensions.width}px × ${dimensions.height}px`;
      } else {
        subtitle = undefined;
      }

      type PreviewMedia = NonNullable<PreviewValue["media"]>;
      let media: PreviewMedia = ImageIcon as PreviewMedia;
      if (isVideo) {
        media = (poster ?? PlayIcon) as PreviewMedia;
      } else if (image) {
        media = image as PreviewMedia;
      }

      return {
        title: mainTitle,
        subtitle,
        media,
      };
    },
  },
});
