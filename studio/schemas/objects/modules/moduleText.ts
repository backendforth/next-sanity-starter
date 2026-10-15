import { TextIcon } from "@sanity/icons/Text";
import { defineType } from "sanity";

import { firstLocalizedLabel } from "../../../utils/firstLocalizedLabel";

export const moduleText = defineType({
  name: "module.text",
  title: "Text",
  type: "object",
  icon: TextIcon,
  fields: [
    {
      name: "heading",
      title: "Heading",
      type: "internationalizedArrayString",
    },
    {
      name: "body",
      title: "Body",
      type: "internationalizedArrayRichTextMedia",
    },
  ],
  preview: {
    select: {
      headingEntries: "heading",
    },
    prepare({ headingEntries }) {
      return {
        title: firstLocalizedLabel(headingEntries, "Text"),
        subtitle: "Text module",
      };
    },
  },
});
