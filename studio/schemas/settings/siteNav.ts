import { MenuIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { modulesArrayField } from "../objects/modules/modulesArrayField";

/** Main/footer navigation. Web Preview is disabled in Presentation (see `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW` in `config/presentation/conventions.ts`). */
export const siteNav = defineType({
  name: "siteNav",
  type: "document",
  title: "Navigation",
  icon: MenuIcon,
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
      initialValue: "Navigation",
      hidden: true,
    },
    {
      title: "Main Menu",
      name: "mainMenu",
      type: "array",
      of: [{ type: "link" }],
    },
    {
      title: "Footer Menu",
      name: "footerMenu",
      type: "array",
      of: [{ type: "link" }],
    },
    modulesArrayField(),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return {
        title: title ?? "Navigation",
      };
    },
  },
});
