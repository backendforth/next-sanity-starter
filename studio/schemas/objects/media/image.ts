import { ImageIcon } from "@sanity/icons/Image";
import { defineType } from "sanity";
import { plainLabel } from "../../../utils/plainLabel";
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
  preview: {
    select: {
      image: "image",
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
        title: plainLabel(caption, "Image"),
        subtitle,
        media: selection.image,
      };
    },
  },
});
