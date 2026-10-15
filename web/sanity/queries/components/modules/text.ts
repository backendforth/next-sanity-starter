import { internationalizedRichTextMediaBodyQuery } from "../text/richTextMedia";

/**
 * `module.text` (`objects/modules/moduleText.ts`): `heading` = i18n strings; `body` = `internationalizedArrayRichTextMedia`.
 */
export const moduleTextQuery = `_type == "module.text" => {
  heading,
  ${internationalizedRichTextMediaBodyQuery}
}`;
