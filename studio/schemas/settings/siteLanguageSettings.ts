import { TranslateIcon } from "@sanity/icons/Translate";
import { defineType } from "sanity";

/**
 * Defines the site's languages: URL segments, the `language` values on
 * translated documents, and the default (unprefixed) locale. Global singleton
 * (fixed `_id`, no `language` field). Next.js reads it at runtime; the Studio's
 * `@sanity/document-internationalization` loads it via
 * `config/sync/supportedLanguages.ts`.
 */
export const siteLanguageSettings = defineType({
  name: "siteLanguageSettings",
  title: "Site languages",
  type: "document",
  icon: TranslateIcon,
  /** First-time create of the singleton — editors can add/remove/reorder languages after. */
  initialValue: {
    availableLanguages: [
      { _key: "lang-en", id: "en", title: "English" },
      { _key: "lang-de", id: "de", title: "Deutsch" },
    ],
    defaultLanguageId: "en",
  },
  fields: [
    {
      name: "availableLanguages",
      title: "Available languages",
      type: "array",
      description:
        "Order of the language switch on the website and of the translations menu in Studio. There is no fallback between languages: a page that doesn't exist in a language isn't shown in it.",
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
        "Used for unprefixed URLs (e.g. /about) and as the language of documents created outside the translation menu.",
      validation: (rule) =>
        rule.required().custom((value, context) => {
          const parent = context.parent as
            | { availableLanguages?: { id?: string }[] }
            | undefined;
          const ids =
            parent?.availableLanguages
              ?.map((row) => row.id)
              .filter((id): id is string => typeof id === "string") ?? [];
          /* Exact match, no trimming: queries read the stored value as is. */
          if (typeof value !== "string" || !ids.includes(value)) {
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
