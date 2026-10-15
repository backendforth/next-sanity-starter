import { ImagesIcon } from "@sanity/icons/Images";
import { PlayIcon } from "@sanity/icons/Play";
import { defineType, type PreviewValue } from "sanity";
import { plainLabel } from "../../../utils/plainLabel";

export const moduleCarousel = defineType({
  name: "module.carousel",
  title: "Carousel",
  type: "object",
  icon: ImagesIcon,
  fieldsets: [
    {
      name: "behavior",
      title: "Carousel behavior",
      options: { collapsible: true, collapsed: false },
    },
  ],
  fields: [
    {
      name: "heading",
      title: "Heading",
      type: "string",
    },
    {
      name: "slides",
      title: "Slides",
      description: "Each slide is an image, a video or a loop.",
      type: "array",
      of: [{ type: "module.media" }],
      validation: (rule) =>
        rule.required().min(1).error("Add at least one slide."),
    },
    {
      name: "loop",
      title: "Loop",
      description: "Wrap from the last slide back to the first.",
      type: "boolean",
      initialValue: false,
      fieldset: "behavior",
    },
    {
      name: "showThumbnails",
      title: "Show thumbnails",
      description: "Display a thumbnail strip below the carousel.",
      type: "boolean",
      initialValue: false,
      fieldset: "behavior",
    },
    {
      name: "showNavDots",
      title: "Navigation dots",
      description: "Show pagination dots under the carousel.",
      type: "boolean",
      initialValue: true,
      fieldset: "behavior",
    },
    {
      name: "multipleSlides",
      title: "Multiple slides",
      description:
        "Show several slides at once (equal height). Use the arrow buttons to move through the set.",
      type: "boolean",
      initialValue: false,
      fieldset: "behavior",
    },
    {
      name: "autoplay",
      title: "Autoplay slides",
      description:
        "Automatically advance to the next slide. Independent of per-video autoplay.",
      type: "boolean",
      initialValue: false,
      fieldset: "behavior",
    },
    {
      name: "autoplayDelayMs",
      title: "Autoplay delay (ms)",
      description: "Time between slide changes when autoplay is enabled.",
      type: "number",
      initialValue: 5000,
      hidden: ({ parent }) => parent?.autoplay !== true,
      validation: (rule) => rule.min(1000).integer(),
      fieldset: "behavior",
    },
  ],
  preview: {
    select: {
      heading: "heading",
      slideCount: "slides.length",
      firstType: "slides.0.type",
      firstImage: "slides.0.imageContent.image",
      firstPoster: "slides.0.videoContent.poster",
      firstLoopPoster: "slides.0.videoLoopContent.poster",
    },
    prepare({
      heading,
      slideCount,
      firstType,
      firstImage,
      firstPoster,
      firstLoopPoster,
    }) {
      const count = typeof slideCount === "number" ? slideCount : 0;

      type PreviewMedia = NonNullable<PreviewValue["media"]>;
      let media: PreviewMedia = ImagesIcon as PreviewMedia;
      if (firstType === "image" && firstImage) {
        media = firstImage as PreviewMedia;
      } else if (firstType === "video") {
        media = (firstPoster ?? PlayIcon) as PreviewMedia;
      } else if (firstType === "loop") {
        media = (firstLoopPoster ?? PlayIcon) as PreviewMedia;
      }

      return {
        title: plainLabel(heading, "Carousel"),
        subtitle: `${count} slide${count === 1 ? "" : "s"}`,
        media,
      };
    },
  },
});
