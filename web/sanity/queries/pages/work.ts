import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { routePathProjection } from "../snippets/routePath";
import { pageSeoQuery } from "../snippets/seo";

export const workQuery = defineQuery(`*[_type == "work" && _id == "work"][0]{
  _id,
  title,
  "path": ${routePathProjection},
  ${modulesQuery},
  ${pageSeoQuery}
}`);
