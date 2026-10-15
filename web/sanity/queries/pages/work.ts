import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { pageSeoQuery } from "../snippets/seo";

export const workQuery = defineQuery(`*[_type == "work" && _id == "work"][0]{
  _id,
  title,
  ${modulesQuery},
  ${pageSeoQuery}
}`);
