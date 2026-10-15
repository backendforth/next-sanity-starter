import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { routePathProjection } from "../snippets/routePath";
import { pageSeoQuery } from "../snippets/seo";
import { translationsQuery } from "../snippets/translations";

export const homeQuery =
	defineQuery(`*[_type == "home" && language == $locale][0]{
  _id,
  title,
  language,
  "path": ${routePathProjection},
  ${modulesQuery},
  ${pageSeoQuery},
  ${translationsQuery}
}`);
