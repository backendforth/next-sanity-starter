import { ErrorOutlineIcon } from "@sanity/icons/ErrorOutline";
import { TextIcon } from "@sanity/icons/Text";
import { defineType } from "sanity";
import { onePerLanguage } from "../../utils/onePerLanguage";
import { languageField } from "../fields/languageField";

export const errorSettings = defineType({
  name: "errorSettings",
  title: "Error pages",
  type: "document",
  validation: onePerLanguage,
  icon: ErrorOutlineIcon,
  groups: [
    {
      title: "Editorial",
      name: "editorial",
      icon: TextIcon,
    },
  ],
  fields: [
    languageField,
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
