import { defineQuery } from "next-sanity";

import { moduleMediaInnerFields } from "../components/modules/media";
import { internationalizedRichTextMediaBodyQuery } from "../components/text/richTextMedia";
import { routePathProjection } from "../snippets/routePath";
import { pageSeoQuery } from "../snippets/seo";

export const projectBySlugQuery =
	defineQuery(`*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  "path": ${routePathProjection},
  slug,
  titleMedia{
    _type,
    ${moduleMediaInnerFields}
  },
  ${internationalizedRichTextMediaBodyQuery},
  ${pageSeoQuery}
}`);
