import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { routePathProjection } from "../snippets/routePath";
import { pageSeoQuery } from "../snippets/seo";
import { translationsQuery } from "../snippets/translations";

export const pageBySlugQuery =
	defineQuery(`*[_type == "page" && slug.current == $slug && language == $locale][0]{
  _id,
  title,
  "path": ${routePathProjection},
  slug,
  language,
  ${modulesQuery},
  ${pageSeoQuery},
  ${translationsQuery}
}`);
