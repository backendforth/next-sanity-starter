import { ErrorOutlineIcon } from "@sanity/icons/ErrorOutline";
import type { StructureBuilder } from "sanity/structure";

export function errorSettingsStructureItem(S: StructureBuilder) {
  return S.listItem()
    .singleton("errorSettings")
    .title("Error pages")
    .icon(ErrorOutlineIcon)
    .id("error-settings");
}
