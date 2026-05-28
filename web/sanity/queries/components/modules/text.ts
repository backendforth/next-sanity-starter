import { richTextMediaQuery } from "../text/richTextMedia";

/** `module.text` (`objects/modules/moduleText.ts`): plain `title` + `body` (richTextMedia). */
export const moduleTextQuery = `_type == "module.text" => {
  title,
  body[]{
    ${richTextMediaQuery}
  }
}`;
