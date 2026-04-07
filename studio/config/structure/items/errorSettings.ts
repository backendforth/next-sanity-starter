import { ErrorOutlineIcon } from "@sanity/icons";
import type { StructureBuilder } from "sanity/structure";

export function errorSettingsStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Error pages")
    .icon(ErrorOutlineIcon)
    .id("singleton-error-settings")
    .child(
      S.document().schemaType("errorSettings").documentId("errorSettings"),
    );
}
