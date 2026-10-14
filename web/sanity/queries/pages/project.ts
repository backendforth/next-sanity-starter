import { defineQuery } from "next-sanity";

import { richTextMediaQuery } from "../components/text/richTextMedia";
import { routePathProjection } from "../snippets/routePath";
import { pageSeoQuery } from "../snippets/seo";
import { translationsQuery } from "../snippets/translations";

/** Project detail — one document per locale (doc-level i18n). */
export const projectBySlugQuery =
	defineQuery(`*[_type == "project" && slug.current == $slug && language == $locale][0]{
  _id,
  title,
  "path": ${routePathProjection},
  language,
  body[]{
    ${richTextMediaQuery}
  },
  ${pageSeoQuery},
  ${translationsQuery}
}`);
