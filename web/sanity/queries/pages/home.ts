import { modulesQuery } from "../components/modules";
import { seoQuery } from "../snippets/seo";

export const homeQuery = `*[_id == "home"][0]{
  _id,
  title,
  ${modulesQuery},
  ${seoQuery}
}`;
