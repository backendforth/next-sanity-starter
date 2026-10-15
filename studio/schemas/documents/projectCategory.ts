import { TagIcon } from "@sanity/icons/Tag";
import { defineType } from "sanity";
import { plainLabel } from "../../utils/plainLabel";
import { languageField } from "../fields/languageField";

export const projectCategory = defineType({
  name: "projectCategory",
  title: "Project category",
  type: "document",
  icon: TagIcon,
  fields: [
    languageField,
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
      const headline = plainLabel(title, "Category");
      return {
        title: headline,
        subtitle: language ?? undefined,
      };
    },
  },
});
