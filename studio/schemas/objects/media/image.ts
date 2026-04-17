import { ImageIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { MediaImagePreview } from "../../../components/previews/MediaImagePreview";

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
    preview: MediaImagePreview,
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
