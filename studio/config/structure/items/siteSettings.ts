import { CogIcon } from "@sanity/icons/Cog";
import type { StructureBuilder } from "sanity/structure";

export function siteSettingsStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Settings")
    .icon(CogIcon)
    .id("site-settings")
    .child(S.document().schemaType("siteSettings").documentId("siteSettings"));
}
