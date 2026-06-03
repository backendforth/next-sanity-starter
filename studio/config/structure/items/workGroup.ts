import { ThLargeIcon } from "@sanity/icons";
import type { StructureBuilder } from "sanity/structure";

import { projectCategoriesStructureItem } from "./projectCategories";
import { projectsStructureItem } from "./projects";
import { workStructureItem } from "./work";

/** Work singleton + project documents — same pattern as the Settings group. */
export function workGroupStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Work")
    .icon(ThLargeIcon)
    .id("work-group")
    .child(
      S.list()
        .title("Work")
        .items([
          workStructureItem(S),
          projectsStructureItem(S),
          projectCategoriesStructureItem(S),
        ]),
    );
}
