import { defineArrayMember, defineType } from "sanity";

import { richTextModulePreview } from "../../../components/previews/RichTextModulePreview";
import { portableTextAnnotations } from "./text/annotations";
import { portableTextDecorators } from "./text/decorators";
import { portableTextLists } from "./text/lists";
import { portableTextStyles } from "./text/styles";

/**
 * Portable Text + inline modules; registered as `richTextMedia`. Used as a
 * plain field type: the document's `language` carries the locale.
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
      components: {
        preview: richTextModulePreview("Media", { showTitle: true }),
      },
    }),
    defineArrayMember({
      type: "module.carousel",
      components: {
        preview: richTextModulePreview("Carousel", { showTitle: false }),
      },
    }),
  ],
});
