import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { routePathProjection } from "../snippets/routePath";
import { pageSeoQuery } from "../snippets/seo";
import { translationsQuery } from "../snippets/translations";

/** `work` landing — one document per locale (doc-level i18n). */
export const workQuery =
	defineQuery(`*[_type == "work" && language == $locale][0]{
  _id,
  title,
  "path": ${routePathProjection},
  ${modulesQuery},
  ${pageSeoQuery},
  ${translationsQuery}
}`);
