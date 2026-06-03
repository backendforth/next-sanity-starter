import { TagIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { firstLocalizedLabel } from "../../utils/firstLocalizedLabel";

export const projectCategory = defineType({
  name: "projectCategory",
  title: "Project category",
  type: "document",
  icon: TagIcon,
  fields: [
    {
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      validation: (rule) => rule.required(),
    },
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return {
        title: firstLocalizedLabel(title, "Category"),
      };
    },
  },
});
