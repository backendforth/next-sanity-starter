import { defineType } from "sanity";

import { seoFields } from "./seoFields";

export const seoPage = defineType({
  name: "seo.page",
  title: "SEO",
  type: "object",
  fields: seoFields("Override for <title> and Open Graph title."),
});
