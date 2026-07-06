import { MenuIcon } from "@sanity/icons/Menu";
import { defineType } from "sanity";

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
      of: [
        { type: "link" },
        { type: "nav.languageSwitch" },
        { type: "nav.themeToggle" },
      ],
    },
    {
      title: "Footer Menu",
      name: "footerMenu",
      type: "array",
      of: [{ type: "link" }],
    },
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
