import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { SearchIcon } from "@sanity/icons/Search";
import { TextIcon } from "@sanity/icons/Text";
import { defineType } from "sanity";
import { isUniqueLocaleAgnostic, validateSlug } from "../../utils/validateSlug";
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
    {
      name: "language",
      type: "string",
      readOnly: true,
      hidden: true,
      initialValue: "en",
    },
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
        isUnique: isUniqueLocaleAgnostic,
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
      title: "title",
      slug: "slug",
      language: "language",
    },
    prepare({ title, slug, language }) {
      const path = slug?.current?.trim() ? `/${slug.current}` : "Page";
      return {
        title: typeof title === "string" && title.trim() ? title : path,
        subtitle: language ? `${path} · ${language}` : path,
      };
    },
  },
});
