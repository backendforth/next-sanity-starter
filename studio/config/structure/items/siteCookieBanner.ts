import { LockIcon } from "@sanity/icons/Lock";
import type { StructureBuilder } from "sanity/structure";

export function siteCookieBannerStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Cookie Banner")
    .icon(LockIcon)
    .id("site-cookie-banner")
    .child(
      S.document()
        .schemaType("siteCookieBanner")
        .documentId("siteCookieBanner"),
    );
}
