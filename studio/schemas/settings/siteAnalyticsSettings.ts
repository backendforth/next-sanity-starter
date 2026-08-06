import { ChartUpwardIcon } from "@sanity/icons/ChartUpward";
import { defineArrayMember, defineField, defineType } from "sanity";

/** Analytics & tracking providers. Web Preview is disabled in Presentation (see `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW`). */
export const siteAnalyticsSettings = defineType({
  name: "siteAnalyticsSettings",
  type: "document",
  title: "Analytics & Tracking",
  icon: ChartUpwardIcon,
  fields: [
    defineField({
      title: "Title",
      name: "title",
      type: "string",
      initialValue: "Analytics & Tracking",
      hidden: true,
    }),
    defineField({
      name: "loadMode",
      title: "Loading mode",
      description:
        "On page load: trackers run immediately. Respect cookie banner: cookie-based trackers wait for analytics consent when the cookie banner is active; cookie-free trackers still load immediately.",
      type: "string",
      options: {
        list: [
          { title: "Load on page load", value: "onPageLoad" },
          { title: "Respect cookie banner", value: "respectCookieBanner" },
        ],
        layout: "radio",
      },
      initialValue: "respectCookieBanner",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "trackers",
      title: "Tracking providers",
      description:
        "Add one entry per provider. Only enabled providers with valid configuration are loaded on the site.",
      type: "array",
      of: [
        defineArrayMember({ type: "trackerGoogleAnalytics" }),
        defineArrayMember({ type: "trackerMatomo" }),
        defineArrayMember({ type: "trackerMicrosoftClarity" }),
        defineArrayMember({ type: "trackerPostHog" }),
        defineArrayMember({ type: "trackerPlausible" }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", loadMode: "loadMode" },
    prepare({ title, loadMode }) {
      const modeLabel =
        loadMode === "onPageLoad" ? "Page load" : "Cookie banner";
      return {
        title: title ?? "Analytics & Tracking",
        subtitle: modeLabel,
      };
    },
  },
});
