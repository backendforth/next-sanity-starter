import { ImagesIcon, PlayIcon } from "@sanity/icons";
import { defineType, type PreviewValue } from "sanity";

import { firstLocalizedLabel } from "../../../utils/firstLocalizedLabel";

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
      imagesOnly: "imagesOnly",
      slideCount: "slides.length",
      slidesMediaCount: "slidesMedia.length",
      firstPlainSlide: "slides.0",
      mediaSlideType: "slidesMedia.0.type",
      mediaSlideImage: "slidesMedia.0.imageContent.image",
      mediaSlidePoster: "slidesMedia.0.videoContent.poster",
    },
    prepare({
      heading,
      imagesOnly,
      slideCount,
      slidesMediaCount,
      firstPlainSlide,
      mediaSlideType,
      mediaSlideImage,
      mediaSlidePoster,
    }) {
      const count =
        imagesOnly === false
          ? typeof slidesMediaCount === "number"
            ? slidesMediaCount
            : 0
          : typeof slideCount === "number"
            ? slideCount
            : 0;

      type PreviewMedia = NonNullable<PreviewValue["media"]>;
      let media: PreviewMedia = ImagesIcon as PreviewMedia;
      if (imagesOnly !== false) {
        if (firstPlainSlide) {
          media = firstPlainSlide as PreviewMedia;
        }
      } else if (mediaSlideType === "image" && mediaSlideImage) {
        media = mediaSlideImage as PreviewMedia;
      } else if (mediaSlideType === "video") {
        media = (mediaSlidePoster ?? PlayIcon) as PreviewMedia;
      }

      return {
        title: firstLocalizedLabel(heading, "Carousel"),
        subtitle: `${count} slide${count === 1 ? "" : "s"}`,
        media,
      };
    },
  },
});
