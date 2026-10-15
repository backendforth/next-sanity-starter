import { MenuIcon } from "@sanity/icons/Menu";
import { defineType } from "sanity";
import { onePerLanguage } from "../../utils/onePerLanguage";
import { languageField } from "../fields/languageField";

/** Main/footer navigation. Web Preview is disabled in Presentation (see `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW` in `config/presentation/conventions.ts`). */
export const siteNav = defineType({
  name: "siteNav",
  type: "document",
  validation: onePerLanguage,
  title: "Navigation",
  icon: MenuIcon,
  fields: [
    languageField,
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
    select: { language: "language" },
    prepare({ language }) {
      return { title: "Navigation", subtitle: language || undefined };
    },
  },
});
