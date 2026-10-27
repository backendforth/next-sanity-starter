import { LockIcon } from "@sanity/icons/Lock";
import type { StructureBuilder } from "sanity/structure";

export function siteCookieBannerStructureItem(S: StructureBuilder) {
  return S.listItem()
    .singleton("siteCookieBanner")
    .title("Cookie Banner")
    .icon(LockIcon)
    .id("site-cookie-banner");
}
