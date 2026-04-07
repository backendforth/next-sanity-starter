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
    },
    {
      name: "description",
      title: "Meta description",
      type: "text",
      rows: 3,
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
