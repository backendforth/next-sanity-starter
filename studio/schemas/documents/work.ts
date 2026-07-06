import { SearchIcon } from "@sanity/icons/Search";
import { TextIcon } from "@sanity/icons/Text";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { defineType } from "sanity";

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
      title: "title",
      language: "language",
    },
    prepare({ title, language }) {
      const headline =
        typeof title === "string" && title.trim() ? title : "Work";
      return {
        title: headline,
        subtitle: language ? `/work · ${language}` : "/work",
      };
    },
  },
});
