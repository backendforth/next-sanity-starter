import { TranslateIcon } from "@sanity/icons/Translate";
import type { StructureBuilder } from "sanity/structure";

export function siteLanguageSettingsStructureItem(S: StructureBuilder) {
  return S.listItem()
    .singleton("siteLanguageSettings")
    .title("Site languages")
    .icon(TranslateIcon)
    .id("site-language-settings");
}
