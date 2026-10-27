import { ThLargeIcon } from "@sanity/icons/ThLarge";
import type { StructureBuilder } from "sanity/structure";

export function workStructureItem(S: StructureBuilder) {
  return S.listItem().singleton("work").title("Work").icon(ThLargeIcon);
}
