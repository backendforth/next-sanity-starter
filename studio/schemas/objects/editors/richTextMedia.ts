import { defineArrayMember, defineType } from "sanity";

import { CarouselRichTextPreview } from "../../../components/previews/CarouselRichTextPreview";
import { MediaRichTextPreview } from "../../../components/previews/MediaRichTextPreview";
import { portableTextAnnotations } from "./text/annotations";
import { portableTextDecorators } from "./text/decorators";
import { portableTextLists } from "./text/lists";
import { portableTextStyles } from "./text/styles";

/**
 * Portable Text + inline modules; registered as `richTextMedia` for
 * `internationalizedArrayRichTextMedia`.
 */
export const richTextMedia = defineType({
  name: "richTextMedia",
  title: "Rich text (with media)",
  type: "array",
  of: [
    {
      type: "block",
      styles: portableTextStyles,
      lists: portableTextLists,
      marks: {
        decorators: portableTextDecorators,
        annotations: portableTextAnnotations,
      },
    },
    defineArrayMember({
      type: "module.media",
      components: { preview: MediaRichTextPreview },
    }),
    defineArrayMember({
      type: "module.carousel",
      components: { preview: CarouselRichTextPreview },
    }),
  ],
});
