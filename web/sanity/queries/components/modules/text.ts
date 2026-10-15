import { richTextMediaBodyQuery } from "../text/richTextMedia";

/** `module.text` (`objects/modules/moduleText.ts`): plain `heading` + `body` (richTextMedia). */
export const moduleTextQuery = `_type == "module.text" => {
  heading,
  ${richTextMediaBodyQuery}
}`;
