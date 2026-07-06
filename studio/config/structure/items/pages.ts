import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import type { StructureBuilder } from "sanity/structure";

export function pagesStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Pages")
    .icon(DocumentTextIcon)
    .child(S.documentTypeList("page").title("Pages"));
}
