import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { SearchIcon } from "@sanity/icons/Search";
import { TextIcon } from "@sanity/icons/Text";
import { defineType } from "sanity";
import {
  isUniqueLocaleAgnostic,
  validatePageSlug,
} from "../../utils/validateSlug";
import { languageField } from "../fields/languageField";
import { modulesArrayField } from "../fields/modulesArrayField";

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
    languageField,
    {
      name: "title",
      title: "Title",
      type: "string",
      group: "editorial",
      validation: (rule) => rule.required(),
    },
    {
      name: "slug",
      title: "Path",
      description:
        "URL path for this page (e.g. yoursite.com/my-path). Use lowercase letters, numbers, and hyphens. The same slug may be reused on different language variants.",
      type: "slug",
      options: {
        maxLength: 96,
        source: "title",
        isUnique: isUniqueLocaleAgnostic,
      },
      validation: validatePageSlug,
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
      title: "title",
      slug: "slug",
      language: "language",
    },
    prepare({ title, slug, language }) {
      const segment = slug?.current?.trim();
      const path = segment ? `/${segment}` : "/";
      const headline = typeof title === "string" && title.trim() ? title : path;
      const subtitle = language ? `${path} · ${language}` : path;
      return {
        title: headline,
        subtitle: headline === path ? undefined : subtitle,
      };
    },
  },
});
