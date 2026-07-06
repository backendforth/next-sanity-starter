import { CodeBlockIcon } from "@sanity/icons/CodeBlock";
import type { StructureBuilder } from "sanity/structure";

export function siteCookieBannerStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Cookie Banner")
    .icon(CodeBlockIcon)
    .id("site-cookie-banner")
    .child(
      S.document()
        .schemaType("siteCookieBanner")
        .documentId("siteCookieBanner"),
    );
}
