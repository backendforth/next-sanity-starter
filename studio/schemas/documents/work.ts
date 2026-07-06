import { SearchIcon } from "@sanity/icons/Search";
import { TextIcon } from "@sanity/icons/Text";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { defineType } from "sanity";

import { firstLocalizedLabel } from "../../utils/firstLocalizedLabel";
import { modulesArrayField } from "../fields/modulesArrayField";

export const work = defineType({
  name: "work",
  title: "Work",
  type: "document",
  icon: ThLargeIcon,
  groups: [
    {
      title: "Editorial",
      name: "editorial",
      icon: TextIcon,
    },
    {
      title: "SEO",
      name: "seo",
      icon: SearchIcon,
    },
  ],
  fields: [
    {
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      group: "editorial",
      validation: (rule) => rule.required(),
    },
    modulesArrayField({ group: "editorial" }),
    {
      name: "seo",
      title: "SEO",
      type: "seo.page",
      group: "seo",
    },
  ],
  preview: {
    select: {
      titleEntries: "title",
    },
    prepare(selection) {
      const { titleEntries } = selection;
      const title = firstLocalizedLabel(titleEntries, "Work");
      return {
        title,
        subtitle: "/work",
      };
    },
  },
});
