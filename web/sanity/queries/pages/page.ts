import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { routePathProjection } from "../snippets/routePath";
import { pageSeoQuery } from "../snippets/seo";

export const pageBySlugQuery =
	defineQuery(`*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  "path": ${routePathProjection},
  ${modulesQuery},
  ${pageSeoQuery}
}`);
