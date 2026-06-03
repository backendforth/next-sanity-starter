import { linkQuery } from "../../snippets/link";

/**
 * Portable Text `value[]` for `internationalizedArrayRichText` / `richText`
 * (`objects/editors/richText.ts`): blocks and link marks only — no embedded modules.
 */
export const richTextQuery = `
  ...,
  _type == "block" => {
    ...,
    markDefs[]{
      ...,
      _type == "link" => {
        ${linkQuery}
      }
    }
  }
`;

/** i18n wrapper for a document-level `body` field using `internationalizedArrayRichText`. */
export const internationalizedRichTextBodyQuery = `
  body[]{
    _key,
    _type,
    language,
    value[]{
      ${richTextQuery}
    }
  }
`;
