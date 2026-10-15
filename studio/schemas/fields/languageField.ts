import { defineField } from "sanity";

import { defaultLanguageFromClient } from "../../config/sync/supportedLanguages";

/**
 * The document's language (document-level i18n). A document type with this field in `fields`
 * is translatable: `TRANSLATABLE_SCHEMA_TYPES` (`sanity.config.ts`) is derived from it.
 * `@sanity/document-internationalization` sets it when a translation is created — never edit,
 * expose or remove it. A document created any other way
 * starts in the site's default language (`siteLanguageSettings.defaultLanguageId`).
 */
export const languageField = defineField({
  name: "language",
  type: "string",
  readOnly: true,
  hidden: true,
  initialValue: async (_params, { getClient }) =>
    defaultLanguageFromClient(getClient({ apiVersion: "2024-01-01" })),
});
