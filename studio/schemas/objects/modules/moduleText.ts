import { TextIcon } from "@sanity/icons/Text";
import { defineType } from "sanity";
import { plainLabel } from "../../../utils/plainLabel";

export const moduleText = defineType({
  name: "module.text",
  title: "Text",
  type: "object",
  icon: TextIcon,
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
    },
    {
      name: "body",
      title: "Body",
      type: "richTextMedia",
    },
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: plainLabel(title, "Text"),
        subtitle: "Text module",
      };
    },
  },
});
