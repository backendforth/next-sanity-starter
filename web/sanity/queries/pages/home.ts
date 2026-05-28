import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { pageSeoQuery } from "../snippets/seo";

export const homeQuery =
	defineQuery(`*[_type == "home" && language == $locale][0]{
  _id,
  title,
  language,
  ${modulesQuery},
  ${pageSeoQuery}
}`);
