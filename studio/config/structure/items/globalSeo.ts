import { SearchIcon } from "@sanity/icons";
import type { StructureBuilder } from "sanity/structure";

export function globalSeoStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Global SEO")
    .icon(SearchIcon)
    .id("singleton-global-seo")
    .child(S.document().schemaType("globalSeo").documentId("globalSeo"));
}
