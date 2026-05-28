import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { pageSeoQuery } from "../snippets/seo";

export const pageBySlugQuery =
	defineQuery(`*[_type == "page" && slug.current == $slug && language == $locale][0]{
  _id,
  title,
  slug,
  language,
  ${modulesQuery},
  ${pageSeoQuery}
}`);
