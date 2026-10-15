import { ImageIcon } from "@sanity/icons/Image";
import { defineType } from "sanity";

import { MediaFieldPreview } from "../../../components/previews/MediaFieldPreview";
import { IMAGE_COLOR_PROFILE_HINT } from "../../constants/media";

export const mediaImage = defineType({
  name: "media.image",
  title: "Image",
  type: "object",
  icon: ImageIcon,
  fields: [
    {
      name: "image",
      title: "Image",
      type: "image",
      description: IMAGE_COLOR_PROFILE_HINT,
      options: { hotspot: true },
      /** Requiredness is enforced by parents (e.g. `module.media` when `type === "image"`), not here — hidden nested fields would otherwise validate when the sibling mode is active. */
    },
    {
      name: "caption",
      title: "Caption",
      type: "string",
    },
  ],
  components: {
    preview: MediaFieldPreview,
  },
  preview: {
    select: {
      image: "image",
      poster: "image.asset",
      filename: "image.asset.originalFilename",
      dimensions: "image.asset.metadata.dimensions",
      caption: "caption",
    },
    prepare(selection) {
      const { filename, dimensions, caption } = selection;
      const subtitle =
        dimensions && filename
          ? `${filename} (${dimensions.width}px × ${dimensions.height}px)`
          : undefined;
      return {
        title:
          typeof caption === "string" && caption.trim() ? caption : "Image",
        subtitle,
        media: selection.image,
      };
    },
  },
});
