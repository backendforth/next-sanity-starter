import { defineType } from "sanity";

import { seoFields } from "./seoFields";

export const seoFallback = defineType({
  name: "seo.fallback",
  title: "SEO Fallback",
  type: "object",
  fields: seoFields("Default <title> and Open Graph title."),
});
