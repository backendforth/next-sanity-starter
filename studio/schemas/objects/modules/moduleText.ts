import { TextIcon } from "@sanity/icons/Text";
import { defineType } from "sanity";

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
      validation: (rule) => rule.required(),
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
        title: typeof title === "string" && title.trim() ? title : "Text",
        subtitle: "Text module",
      };
    },
  },
});
