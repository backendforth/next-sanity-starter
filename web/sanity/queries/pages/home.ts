import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { routePathProjection } from "../snippets/routePath";
import { pageSeoQuery } from "../snippets/seo";

export const homeQuery = defineQuery(`*[_type == "home" && _id == "home"][0]{
  _id,
  title,
  "path": ${routePathProjection},
  ${modulesQuery},
  ${pageSeoQuery}
}`);
