import { defineType } from "sanity";

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
    { type: "module.media" },
    { type: "module.carousel" },
    { type: "module.text" },
  ],
});
