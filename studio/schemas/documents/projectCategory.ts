import { TagIcon } from "@sanity/icons/Tag";
import { defineType } from "sanity";

export const projectCategory = defineType({
  name: "projectCategory",
  title: "Project category",
  type: "document",
  icon: TagIcon,
  fields: [
    {
      name: "language",
      type: "string",
      readOnly: true,
      hidden: true,
      initialValue: "en",
    },
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    },
  ],
  preview: {
    select: {
      title: "title",
      language: "language",
    },
    prepare({ title, language }) {
      const headline =
        typeof title === "string" && title.trim() ? title : "Category";
      return {
        title: headline,
        subtitle: language ?? undefined,
      };
    },
  },
});
