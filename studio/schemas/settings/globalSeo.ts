import { SearchIcon, TextIcon } from "@sanity/icons";
import { defineType } from "sanity";

/**
 * Singleton for site-wide SEO defaults (not page content).
 * Frontend: merge with per-document `seo` on pages/home (document wins, else this).
 */
export const globalSeo = defineType({
  name: "globalSeo",
  title: "Global SEO",
  type: "document",
  icon: SearchIcon,
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
      name: "label",
      title: "Label",
      type: "string",
      description: "Optional note in the desk (e.g. “Production defaults”).",
      group: "editorial",
    },
    {
      name: "defaults",
      title: "Default meta & social",
      type: "seo.page",
      description:
        "Fallback title, description and OG image when a page has no SEO override.",
      group: "seo",
    },
  ],
  preview: {
    prepare() {
      return {
        title: "Global SEO",
      };
    },
  },
});
