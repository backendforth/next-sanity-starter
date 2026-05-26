import { defineType } from "sanity";

export const seoPage = defineType({
  name: "seo.page",
  title: "SEO",
  type: "object",
  fields: [
    {
      name: "title",
      title: "Meta title",
      type: "string",
      description: "Override for <title> and Open Graph title.",
      validation: (rule) => rule.warning().max(60),
    },
    {
      name: "description",
      title: "Meta description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.warning().max(160),
    },
    {
      name: "image",
      title: "Social / OG image",
      type: "image",
      options: {
        hotspot: true,
      },
    },
  ],
});

export const seoFallback = defineType({
  name: "seo.fallback",
  title: "SEO Fallback",
  type: "object",
  fields: [
    {
      name: "title",
      title: "Meta title",
      type: "string",
      description: "Default <title> and Open Graph title.",
      validation: (rule) => rule.warning().max(60),
    },
    {
      name: "description",
      title: "Meta description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.warning().max(160),
    },
    {
      name: "image",
      title: "Social / OG image",
      type: "image",
      options: {
        hotspot: true,
      },
    },
  ],
});
