import { seoQuery } from "../snippets/seo";
import { modulesQuery } from "../components/modules";

export const homeQuery = `*[_id == "home"][0]{
  _id,
  title,
  ${modulesQuery},
  ${seoQuery}
}`;
