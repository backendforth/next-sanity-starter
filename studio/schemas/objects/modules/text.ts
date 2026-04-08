import { TextIcon } from "@sanity/icons";
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
      type: "internationalizedArrayString",
      validation: (rule) => rule.required(),
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
      let label = "Text";
      if (Array.isArray(titleEntries)) {
        const first = titleEntries.find(
          (t: { value?: unknown }) =>
            typeof t?.value === "string" && t.value.trim().length > 0,
        );
        if (first && typeof first.value === "string") {
          label = first.value.trim();
        }
      }
      return {
        title: label,
        subtitle: "Text module",
      };
    },
  },
});
