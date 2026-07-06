import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { SearchIcon } from "@sanity/icons/Search";
import { TextIcon } from "@sanity/icons/Text";
import { defineType } from "sanity";
import { firstLocalizedLabel } from "../../utils/firstLocalizedLabel";
import { validateSlug } from "../../utils/validateSlug";
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
      titleEntries: "title",
      slug: "slug",
    },
    prepare(selection) {
      const { titleEntries, slug } = selection;
      const segment = slug?.current?.trim();
      const path = segment ? `/${segment}` : "/";
      const title = firstLocalizedLabel(titleEntries, path);
      return {
        title,
        subtitle: title === path ? undefined : path,
      };
    },
  },
});
