import { MenuIcon } from "@sanity/icons/Menu";
import type { StructureBuilder } from "sanity/structure";

export function siteNavStructureItem(S: StructureBuilder) {
  return S.listItem()
    .singleton("siteNav")
    .title("Navigation")
    .icon(MenuIcon)
    .id("site-nav");
}
