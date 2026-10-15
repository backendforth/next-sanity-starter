import { ErrorOutlineIcon } from "@sanity/icons/ErrorOutline";
import { TextIcon } from "@sanity/icons/Text";
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
      name: "notFoundTitle",
      title: "404 — Title",
      type: "internationalizedArrayString",
      group: "editorial",
      validation: (rule) => rule.required(),
    },
    {
      name: "notFoundBody",
      title: "404 — Body",
      type: "internationalizedArrayRichText",
      description: "Basic rich text (no media modules).",
      group: "editorial",
    },
    {
      name: "serverErrorTitle",
      title: "500 — Title",
      type: "internationalizedArrayString",
      group: "editorial",
      validation: (rule) => rule.required(),
    },
    {
      name: "serverErrorBody",
      title: "500 — Body",
      type: "internationalizedArrayRichText",
      description: "Basic rich text (no media modules).",
      group: "editorial",
    },
  ],
  preview: {
    prepare() {
      return {
        title: "Error pages",
      };
    },
  },
});
