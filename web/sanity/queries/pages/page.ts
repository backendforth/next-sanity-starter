import { seoQuery } from "../snippets/seo";
import { modulesQuery } from "../components/modules";

export const pageBySlugQuery = `*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  ${modulesQuery},
  ${seoQuery}
}`;
