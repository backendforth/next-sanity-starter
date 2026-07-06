import { ImageIcon } from "@sanity/icons/Image";
import { PlayIcon } from "@sanity/icons/Play";
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
          { title: "Loop", value: "loop" },
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
    {
      name: "videoLoopContent",
      title: "Loop",
      type: "media.videoLoop",
      hidden: ({ parent }) => parent?.type !== "loop",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          if (parent?.type !== "loop") {
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
      loopPoster: "videoLoopContent.poster",
      loopTracks: "videoLoopContent.video.asset.data.tracks",
      loopDuration: "videoLoopContent.video.asset.data.duration",
    },
    prepare(selection) {
      const {
        type,
        image,
        filename,
        dimensions,
        poster,
        tracks,
        duration,
        loopPoster,
        loopTracks,
        loopDuration,
      } = selection;

      const isVideo = type === "video";
      const isLoop = type === "loop";

      const activeTracks = isLoop ? loopTracks : tracks;
      const activeDuration = isLoop ? loopDuration : duration;
      const activePoster = isLoop ? loopPoster : poster;

      const durationString = getDurationString(
        typeof activeDuration === "number" ? activeDuration : undefined,
      );

      const videoTrack = Array.isArray(activeTracks)
        ? activeTracks.find((el: { type?: string }) => el?.type === "video")
        : undefined;
      const videoWidth = videoTrack
        ? (videoTrack as { max_width?: number }).max_width
        : undefined;
      const videoHeight = videoTrack
        ? (videoTrack as { max_height?: number }).max_height
        : undefined;

      /** Main line: filename (image), “Video”, or “Loop”. Kicker “Media” comes from `MediaPreview`. */
      let mainTitle: string;
      if (isLoop) {
        mainTitle = "Loop";
      } else if (isVideo) {
        mainTitle = "Video";
      } else if (filename && String(filename).trim()) {
        mainTitle = String(filename);
      } else {
        mainTitle = "Image";
      }

      let subtitle: string | undefined;
      if (isVideo || isLoop) {
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
      if (isVideo || isLoop) {
        media = (activePoster ?? PlayIcon) as PreviewMedia;
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
