import { TranslateIcon } from "@sanity/icons/Translate";
import type { StructureBuilder } from "sanity/structure";

export function siteLanguageSettingsStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Site languages")
    .icon(TranslateIcon)
    .id("site-language-settings")
    .child(
      S.document()
        .schemaType("siteLanguageSettings")
        .documentId("siteLanguageSettings"),
    );
}
