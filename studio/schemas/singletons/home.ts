import { HomeIcon, SearchIcon, TextIcon } from "@sanity/icons";
import { defineType } from "sanity";

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
    {
      name: "body",
      title: "Body",
      type: "internationalizedArrayRichTextMedia",
      group: "editorial",
    },
    {
      name: "seo",
      title: "SEO",
      type: "seo.page",
      group: "seo",
    },
  ],
  preview: {
    prepare() {
      return {
        title: "Home",
      };
    },
  },
});
