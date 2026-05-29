import { ErrorOutlineIcon, TextIcon } from "@sanity/icons";
import { defineType } from "sanity";

export const errorSettings = defineType({
  name: "errorSettings",
  title: "Error pages",
  type: "document",
  icon: ErrorOutlineIcon,
  groups: [
    {
      title: "Editorial",
      name: "editorial",
      icon: TextIcon,
    },
  ],
  fields: [
    {
      name: "language",
      type: "string",
      readOnly: true,
      hidden: true,
      initialValue: "en",
    },
    {
      name: "notFoundTitle",
      title: "404 — Title",
      type: "string",
      group: "editorial",
      validation: (rule) => rule.required(),
    },
    {
      name: "notFoundBody",
      title: "404 — Body",
      type: "richText",
      description: "Basic rich text (no media modules).",
      group: "editorial",
    },
    {
      name: "serverErrorTitle",
      title: "500 — Title",
      type: "string",
      group: "editorial",
      validation: (rule) => rule.required(),
    },
    {
      name: "serverErrorBody",
      title: "500 — Body",
      type: "richText",
      description: "Basic rich text (no media modules).",
      group: "editorial",
    },
  ],
  preview: {
    select: { language: "language" },
    prepare({ language }) {
      return {
        title: "Error pages",
        subtitle: language || undefined,
      };
    },
  },
});
