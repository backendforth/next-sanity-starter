import { ImagesIcon } from "@sanity/icons";
import { defineType } from "sanity";

export const moduleCarousel = defineType({
  name: "module.carousel",
  title: "Carousel",
  type: "object",
  icon: ImagesIcon,
  fields: [
    {
      name: "slides",
      title: "Slides",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
        },
      ],
    },
  ],
});
