import { defineType } from "sanity";

import { portableTextAnnotations } from "./text/annotations";
import { portableTextDecorators } from "./text/decorators";
import { portableTextLists } from "./text/lists";
import { portableTextStyles } from "./text/styles";

/**
 * Portable Text registered as `richText` for
 * `internationalizedArrayRichText`.
 */
export const richText = defineType({
  name: "richText",
  title: "Rich text",
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
  ],
});
