import { SunIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

/** Placed in **Navigation → Main Menu** to show the light/dark theme toggle at that position. */
export const navThemeToggle = defineType({
  name: "nav.themeToggle",
  title: "Theme toggle",
  type: "object",
  icon: SunIcon,
  fields: [
    // Sanity requires ≥1 field; editors never see this (hidden + read-only).
    defineField({
      name: "blockKind",
      type: "string",
      initialValue: "themeToggle",
      hidden: true,
      readOnly: true,
    }),
  ],
  preview: {
    prepare() {
      return { title: "Theme toggle" };
    },
  },
});
