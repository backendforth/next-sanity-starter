import { TextIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { firstLocalizedLabel } from "../../../utils/firstLocalizedLabel";

export const moduleText = defineType({
  name: "module.text",
  title: "Text",
  type: "object",
  icon: TextIcon,
  fields: [
    {
      name: "title",
      title: "Title",
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
      titleEntries: "title",
    },
    prepare({ titleEntries }) {
      return {
        title: firstLocalizedLabel(titleEntries, "Text"),
        subtitle: "Text module",
      };
    },
  },
});
