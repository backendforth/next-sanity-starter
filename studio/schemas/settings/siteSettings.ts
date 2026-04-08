import { CogIcon, DesktopIcon, SearchIcon } from "@sanity/icons";
import { defineType } from "sanity";

/** Global site settings. Web Preview is disabled in Presentation (see `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW` in `config/presentation/conventions.ts`). */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Settings",
  type: "document",
  icon: CogIcon,
  groups: [
    {
      title: "Site Settings",
      name: "site",
      icon: DesktopIcon,
    },
    {
      title: "SEO",
      name: "seo",
      icon: SearchIcon,
    },
  ],
  fields: [
    {
      title: "Site Title",
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
      group: "site",
    },
    {
      title: "Favicon",
      name: "favicon",
      type: "image",
      group: "site",
    },
    {
      title: "SEO",
      name: "seo",
      type: "seo.fallback",
      group: "seo",
    },
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return {
        title: title || "Settings",
      };
    },
  },
});
