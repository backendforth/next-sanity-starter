import { EarthGlobeIcon, TextIcon } from "@sanity/icons";
import { defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  icon: EarthGlobeIcon,
  groups: [
    {
      title: "Editorial",
      name: "editorial",
      icon: TextIcon,
    },
  ],
  fields: [
    {
      name: "label",
      title: "Label",
      type: "string",
      description: "Internal label for the desk (optional).",
      group: "editorial",
    },
  ],
  preview: {
    prepare() {
      return {
        title: "Site settings",
      };
    },
  },
});
