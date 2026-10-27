import { CaseIcon } from "@sanity/icons/Case";
import type { StructureBuilder } from "sanity/structure";

export function projectsStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Projects")
    .icon(CaseIcon)
    .schemaType("project")
    .showCount()
    .child(S.documentTypeList("project").title("Projects"));
}
