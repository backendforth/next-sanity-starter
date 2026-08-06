import { ChartUpwardIcon } from "@sanity/icons/ChartUpward";
import type { StructureBuilder } from "sanity/structure";

export function siteAnalyticsSettingsStructureItem(S: StructureBuilder) {
  return S.listItem()
    .title("Analytics & Tracking")
    .icon(ChartUpwardIcon)
    .id("site-analytics-settings")
    .child(
      S.document()
        .schemaType("siteAnalyticsSettings")
        .documentId("siteAnalyticsSettings"),
    );
}
