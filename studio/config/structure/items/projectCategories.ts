import { TagIcon } from "@sanity/icons";
import type { StructureBuilder } from "sanity/structure";

export function projectCategoriesStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Categories")
    .icon(TagIcon)
    .child(S.documentTypeList("projectCategory").title("Project categories"));
}
