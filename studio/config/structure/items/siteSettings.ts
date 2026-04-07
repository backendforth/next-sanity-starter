import { EarthGlobeIcon } from "@sanity/icons";
import type { StructureBuilder } from "sanity/structure";

export function siteSettingsStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Site settings")
    .icon(EarthGlobeIcon)
    .id("singleton-site-settings")
    .child(S.document().schemaType("siteSettings").documentId("siteSettings"));
}
