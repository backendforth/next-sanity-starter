import { CogIcon } from "@sanity/icons/Cog";
import { DesktopIcon } from "@sanity/icons/Desktop";
import { SearchIcon } from "@sanity/icons/Search";
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
      name: "language",
      type: "string",
      readOnly: true,
      hidden: true,
      initialValue: "en",
    },
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
      /* Crop + hotspot are the whole point here: the browser icons are derived
         from this one asset (`siteFaviconIcons`), so squaring a wide logo down
         to the part that still reads at 32 px happens in this UI. */
      options: { hotspot: true },
      description:
        "Browser tab icon. Square PNG, at least 512×512. The 32 px, 180 px and 192 px icons are generated from this file, so crop it down to the signet — a full wordmark is unreadable in a tab.",
    },
    {
      title: "SEO",
      name: "seo",
      type: "seo.fallback",
      group: "seo",
    },
  ],
  preview: {
    select: { title: "title", language: "language" },
    prepare({ title, language }) {
      return {
        title: title || "Settings",
        subtitle: language || undefined,
      };
    },
  },
});
