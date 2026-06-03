import { CaseIcon } from "@sanity/icons";
import type { StructureBuilder } from "sanity/structure";

export function projectsStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Projects")
    .icon(CaseIcon)
    .child(S.documentTypeList("project").title("Projects"));
}
