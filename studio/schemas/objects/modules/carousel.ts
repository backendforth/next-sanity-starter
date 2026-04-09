import { ImagesIcon } from "@sanity/icons";
import { defineType } from "sanity";

function headingLabel(heading: unknown, fallback: string): string {
  if (!Array.isArray(heading)) {
    return fallback;
  }
  const first = heading.find(
    (t: { value?: unknown }) =>
      typeof t?.value === "string" && t.value.trim().length > 0,
  );
  if (first && typeof first.value === "string") {
    return first.value.trim();
  }
  return fallback;
}

export const moduleCarousel = defineType({
  name: "module.carousel",
  title: "Carousel",
  type: "object",
  icon: ImagesIcon,
  fields: [
    {
      name: "heading",
      title: "Heading",
      type: "internationalizedArrayString",
    },
    {
      name: "imagesOnly",
      title: "Images only",
      description:
        "On: slides are plain images (hotspot). Off: each slide uses the Media module (image or Mux video, same as elsewhere on the site).",
      type: "boolean",
      initialValue: true,
    },
    {
      name: "slides",
      title: "Slides",
      type: "array",
      hidden: ({ parent }) => parent?.imagesOnly === false,
      of: [
        {
          type: "image",
          options: { hotspot: true },
        },
      ],
    },
    {
      name: "slidesMedia",
      title: "Slides (media)",
      description: "Each slide is an image or video (Mux) block.",
      type: "array",
      hidden: ({ parent }) => parent?.imagesOnly !== false,
      of: [{ type: "module.media" }],
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { imagesOnly?: boolean } | undefined;
          if (parent?.imagesOnly === false) {
            if (!Array.isArray(value) || value.length === 0) {
              return "Add at least one media slide.";
            }
          }
          return true;
        }),
    },
  ],
  preview: {
    select: {
      heading: "heading",
      imagesOnly: "imagesOnly",
      slideCount: "slides.length",
      slidesMediaCount: "slidesMedia.length",
    },
    prepare({ heading, imagesOnly, slideCount, slidesMediaCount }) {
      const title = headingLabel(heading, "Carousel");
      const count =
        imagesOnly === false
          ? typeof slidesMediaCount === "number"
            ? slidesMediaCount
            : 0
          : typeof slideCount === "number"
            ? slideCount
            : 0;
      const mode = imagesOnly === false ? "Media slides" : "Image slides";
      return {
        title,
        subtitle: `${count} slide${count === 1 ? "" : "s"} · ${mode}`,
      };
    },
  },
});
