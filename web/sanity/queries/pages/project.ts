import { defineQuery } from "next-sanity";

import { moduleMediaInnerFields } from "../components/modules/media";
import { richTextMediaQuery } from "../components/text/richTextMedia";
import { pageSeoQuery } from "../snippets/seo";

/** Project detail — one document per locale (doc-level i18n). */
export const projectBySlugQuery =
	defineQuery(`*[_type == "project" && slug.current == $slug && language == $locale][0]{
  _id,
  title,
  slug,
  language,
  titleMedia{
    _type,
    ${moduleMediaInnerFields}
  },
  body[]{
    ${richTextMediaQuery}
  },
  ${pageSeoQuery}
}`);
