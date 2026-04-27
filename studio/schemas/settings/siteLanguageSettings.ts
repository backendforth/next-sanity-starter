import { TranslateIcon } from "@sanity/icons";
import { defineType } from "sanity";

/**
 * Defines which language ids exist on the site (URLs, Studio `internationalizedArray*`, web fallbacks).
 * Next.js and Studio `internationalized-array` read this at runtime (see `config/sync/internationalizedArrayLanguages.ts`).
 */
export const siteLanguageSettings = defineType({
  name: "siteLanguageSettings",
  title: "Site languages",
  type: "document",
  icon: TranslateIcon,
  /**
   * First-time create of the singleton — editors can add/remove/reorder languages after.
   * `title` keeps its field-level `initialValue` below.
   */
  initialValue: {
    availableLanguages: [
      { _key: "lang-en", id: "en", title: "English" },
      { _key: "lang-de", id: "de", title: "Deutsch" },
    ],
    defaultLanguageId: "en",
  },
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "Site languages",
      hidden: true,
    },
    {
      name: "availableLanguages",
      title: "Available languages",
      type: "array",
      description:
        "Order defines fallback order on the website when a translation is missing.",
      validation: (rule) => rule.required().min(1),
      of: [
        {
          type: "object",
          name: "siteLanguage",
          fields: [
            {
              name: "id",
              title: "Language id",
              type: "string",
              description:
                "URL segment and Sanity `language` value (e.g. en, de).",
              validation: (rule) =>
                rule.required().regex(/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/),
            },
            {
              name: "title",
              title: "Label",
              type: "string",
              validation: (rule) => rule.required(),
            },
          ],
          preview: {
            select: { id: "id", title: "title" },
            prepare({ id, title }) {
              return { title: title || id || "Language" };
            },
          },
        },
      ],
    },
    {
      name: "defaultLanguageId",
      title: "Default language",
      type: "string",
      description:
        "Used for unprefixed URLs (e.g. /about) and as the primary default in Studio.",
      validation: (rule) =>
        rule.required().custom((value, context) => {
          const parent = context.parent as
            | { availableLanguages?: { id?: string }[] }
            | undefined;
          const ids =
            parent?.availableLanguages
              ?.map((row) => row.id)
              .filter((id): id is string => typeof id === "string") ?? [];
          if (typeof value !== "string" || !value.trim()) {
            return "Required";
          }
          if (!ids.includes(value.trim())) {
            return "Must be one of the language ids above";
          }
          return true;
        }),
    },
  ],
  preview: {
    prepare() {
      return { title: "Site languages" };
    },
  },
});
