import { ThLargeIcon } from "@sanity/icons";
import type { StructureBuilder } from "sanity/structure";

export function workStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Work")
    .icon(ThLargeIcon)
    .id("work")
    .child(S.document().schemaType("work").documentId("work"));
}
