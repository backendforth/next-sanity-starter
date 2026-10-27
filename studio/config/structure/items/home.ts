import { HomeIcon } from "@sanity/icons/Home";
import type { StructureBuilder } from "sanity/structure";

export function homeStructureItem(S: StructureBuilder) {
  return S.listItem().singleton("home").title("Home").icon(HomeIcon);
}
