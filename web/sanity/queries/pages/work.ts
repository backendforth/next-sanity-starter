import { modulesQuery } from "../components/modules";
import { pageSeoQuery } from "../snippets/seo";

export const workQuery = `*[_id == "work"][0]{
  _id,
  title,
  ${modulesQuery},
  ${pageSeoQuery}
}`;
