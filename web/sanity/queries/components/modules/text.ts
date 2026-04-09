import { richTextMediaQuery } from "../text/richTextMedia";

/**
 * `module.text` (`objects/modules/text.ts`): `title` = i18n strings; `body` = `internationalizedArrayRichTextMedia`.
 */
export const moduleTextQuery = `_type == "module.text" => {
  title,
  body[]{
    _key,
    _type,
    language,
    value[]{
      ${richTextMediaQuery}
    }
  }
}`;
