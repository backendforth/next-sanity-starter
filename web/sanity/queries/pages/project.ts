import { moduleMediaInnerFields } from "../components/modules/media";
import { internationalizedRichTextMediaBodyQuery } from "../components/text/richTextMedia";
import { pageSeoQuery } from "../snippets/seo";

export const projectBySlugQuery = `*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  titleMedia{
    _type,
    ${moduleMediaInnerFields}
  },
  ${internationalizedRichTextMediaBodyQuery},
  ${pageSeoQuery}
}`;
