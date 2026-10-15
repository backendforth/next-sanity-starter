import { defineField } from "sanity";

/**
 * The document's language (document-level i18n): every type in `TRANSLATABLE_SCHEMA_TYPES`
 * (`sanity.config.ts`) carries it. `@sanity/document-internationalization` sets it when a
 * translation is created — never edit, expose or remove it.
 */
export const languageField = defineField({
  name: "language",
  type: "string",
  readOnly: true,
  hidden: true,
  initialValue: "en",
});
