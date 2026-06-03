import { defineQuery } from "next-sanity";

import { modulesQuery } from "../components/modules";
import { pageSeoQuery } from "../snippets/seo";

/** `work` landing — one document per locale (doc-level i18n). */
export const workQuery =
	defineQuery(`*[_type == "work" && language == $locale][0]{
  _id,
  title,
  language,
  ${modulesQuery},
  ${pageSeoQuery}
}`);
