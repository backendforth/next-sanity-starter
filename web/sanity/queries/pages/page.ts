import { modulesQuery } from "../components/modules";
import { pageSeoQuery } from "../snippets/seo";

export const pageBySlugQuery = `*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  ${modulesQuery},
  ${pageSeoQuery}
}`;
