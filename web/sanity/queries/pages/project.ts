import { defineQuery } from "next-sanity";

import { internationalizedRichTextMediaBodyQuery } from "../components/text/richTextMedia";
import { routePathProjection } from "../snippets/routePath";
import { pageSeoQuery } from "../snippets/seo";

export const projectBySlugQuery =
	defineQuery(`*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  "path": ${routePathProjection},
  ${internationalizedRichTextMediaBodyQuery},
  ${pageSeoQuery}
}`);
