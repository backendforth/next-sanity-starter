import { DocumentTextIcon, SearchIcon, TextIcon } from "@sanity/icons";
import { defineType } from "sanity";
import { validateSlug } from "../../utils/validateSlug";
import { modulesArrayField } from "../objects/modules/modulesArrayField";

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  icon: DocumentTextIcon,
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
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      group: "editorial",
      validation: (rule) => rule.required(),
    },
    {
      name: "slug",
      title: "Path",
      description:
        "URL path for this page (e.g. yoursite.com/my-path). Use lowercase letters, numbers, and hyphens.",
      type: "slug",
      options: {
        maxLength: 96,
      },
      validation: validateSlug,
      group: "editorial",
    },
    modulesArrayField({ group: "editorial" }),
    {
      name: "seo",
      title: "SEO",
      type: "seo.page",
      group: "seo",
    },
  ],
  preview: {
    select: {
      slug: "slug",
    },
    prepare(selection) {
      const { slug } = selection;
      return {
        title: slug?.current?.trim() ? `/${slug.current}` : "Page",
      };
    },
  },
});
