import { MenuIcon } from "@sanity/icons/Menu";
import type { StructureBuilder } from "sanity/structure";

export function siteNavStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Navigation")
    .icon(MenuIcon)
    .id("site-nav")
    .child(S.document().schemaType("siteNav").documentId("siteNav"));
}
