import { ChartUpwardIcon } from "@sanity/icons/ChartUpward";
import type { StructureBuilder } from "sanity/structure";

export function siteAnalyticsSettingsStructureItem(S: StructureBuilder) {
  return S.listItem()
    .singleton("siteAnalyticsSettings")
    .title("Analytics & Tracking")
    .icon(ChartUpwardIcon)
    .id("site-analytics-settings");
}
