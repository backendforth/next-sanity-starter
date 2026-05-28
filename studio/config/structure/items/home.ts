import { HomeIcon } from "@sanity/icons";
import type { StructureBuilder } from "sanity/structure";

export function homeStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Home")
    .icon(HomeIcon)
    .id("home")
    .child(S.documentTypeList("home").title("Home"));
}
