import { HomeIcon } from "@sanity/icons/Home";
import { SearchIcon } from "@sanity/icons/Search";
import { TextIcon } from "@sanity/icons/Text";
import { defineType } from "sanity";

import { firstLocalizedLabel } from "../../utils/firstLocalizedLabel";
import { modulesArrayField } from "../fields/modulesArrayField";

export const home = defineType({
  name: "home",
  title: "Home",
  type: "document",
  icon: HomeIcon,
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
      const title = firstLocalizedLabel(titleEntries, "Home");
      return {
        title,
        subtitle: "/",
      };
    },
  },
});
