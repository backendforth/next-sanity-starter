import { TranslateIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

/** Placed in **Navigation → Main Menu** to show the locale selector at that position. */
export const navLanguageSwitch = defineType({
  name: "nav.languageSwitch",
  title: "Language switcher",
  type: "object",
  icon: TranslateIcon,
  fields: [
    // Sanity requires ≥1 field; editors never see this (hidden + read-only).
    defineField({
      name: "blockKind",
      type: "string",
      initialValue: "languageSwitch",
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
