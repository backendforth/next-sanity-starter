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
			// validation: (rule) => rule.required(),
		},
		{
			name: "imageContent",
			title: "Image",
			type: "media.image",
			hidden: ({ parent }) => parent?.type !== "image",
			// validation: (rule) =>
			//   rule.custom((field, context) => {
			//     const parent = context.parent as { type?: string } | undefined;
			//     if (parent?.type === "image") {
			//       const img = field as { image?: unknown } | undefined;
			//       if (!img?.image) {
			//         return "Image is required.";
			//       }
			//     }
			//     return true;
			//   }),
		},
		{
			name: "videoContent",
			title: "Video",
			type: "media.video",
			hidden: ({ parent }) => parent?.type !== "video",
			// validation: (rule) =>
			//   rule.custom((field, context) => {
			//     const parent = context.parent as { type?: string } | undefined;
			//     if (parent?.type === "video") {
			//       const vc = field as { video?: unknown } | undefined;
			//       if (!vc?.video) {
			//         return "Video is required.";
			//       }
			//     }
			//     return true;
			//   }),
		},
	],
	components: {
		preview: MediaPreview,
	},
	preview: {
		select: {
			type: "type",
			image: "imageContent.image",
			filename: "imageContent.image.asset.originalFilename",
			dimensions: "imageContent.image.asset.metadata.dimensions",
			tracks: "videoContent.video.asset.data.tracks",
			duration: "videoContent.video.asset.data.duration",
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
