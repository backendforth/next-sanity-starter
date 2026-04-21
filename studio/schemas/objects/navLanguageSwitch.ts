import { TranslateIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

/** Placed in **Navigation → Main Menu** to show the locale selector at that position. */
export const navLanguageSwitch = defineType({
  name: "nav.languageSwitch",
  title: "Language switcher",
  type: "object",
  icon: TranslateIcon,
  fields: [
    defineField({
      name: "marker",
      type: "boolean",
      initialValue: true,
      hidden: true,
      readOnly: true,
    }),
  ],
  preview: {
    prepare() {
      return { title: "Language switcher" };
    },
  },
});
