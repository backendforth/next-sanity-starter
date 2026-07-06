import { HomeIcon } from "@sanity/icons/Home";
import type { StructureBuilder } from "sanity/structure";

export function homeStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Home")
    .icon(HomeIcon)
    .id("home")
    .child(S.document().schemaType("home").documentId("home"));
}
