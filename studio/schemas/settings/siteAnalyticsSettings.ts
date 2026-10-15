import { ChartUpwardIcon } from "@sanity/icons/ChartUpward";
import { defineArrayMember, defineField, defineType } from "sanity";

type TrackerValue = { enabled?: boolean };

/** Enabled trackers only — `enabled` is opt-out, so a missing flag counts as on. */
function enabledTrackerCount(trackers: unknown): number {
  if (!Array.isArray(trackers)) return 0;
  return trackers.filter(
    (tracker) => (tracker as TrackerValue)?.enabled !== false,
  ).length;
}

/**
 * The consent gate and the providers it gates: the cookie banner switch, the loading mode and
 * the trackers. The banner's texts live in `siteCookieBanner`. Web Preview is disabled in
 * Presentation (see `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW`).
 */
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
      name: "useCookieBanner",
      title: "Use cookie banner",
      description:
        "Off does not stop tracking — it removes the gate. Every enabled tracker then loads with no consent, whatever the loading mode. The banner's texts: Settings → Cookie Banner.",
      type: "boolean",
      initialValue: false,
      validation: (rule) =>
        /* The web reads only an explicit `false` as off (fail closed), so an unset switch is on. */
        rule.warning().custom((value, context) => {
          if (value !== false) return true;
          const count = enabledTrackerCount(
            (context.document as { trackers?: unknown })?.trackers,
          );
          if (count === 0) return true;
          return `${count === 1 ? "1 tracker runs" : `${count} trackers run`} with no consent.`;
        }),
    }),
    defineField({
      name: "loadMode",
      title: "Loading mode",
      description:
        "Respect cookie banner (recommended): cookie-based trackers wait for consent, cookie-free ones load immediately. Load on page load: everything runs before consent — unlawful in the EEA/UK for anything using cookies or storage. No effect while the cookie banner is off.",
      type: "string",
      options: {
        list: [
          { title: "Load on page load", value: "onPageLoad" },
          { title: "Respect cookie banner", value: "respectCookieBanner" },
        ],
        layout: "radio",
      },
      initialValue: "respectCookieBanner",
      validation: (rule) => [
        rule.required(),
        rule.warning().custom((value, context) => {
          if (value !== "onPageLoad") return true;
          const count = enabledTrackerCount(
            (context.document as { trackers?: unknown })?.trackers,
          );
          if (count === 0) return true;
          return `Runs ${count === 1 ? "1 tracker" : `${count} trackers`} before consent and bypasses the banner.`;
        }),
      ],
    }),
    defineField({
      name: "trackers",
      title: "Tracking providers",
      description:
        "One entry per provider. Only enabled, fully configured providers load. Each has its own privacy notes — read them before enabling.",
      type: "array",
      validation: (rule) => [
        /* Each provider runs on one page-wide global (`window.posthog`, `_paq`,
           `clarity`, `dataLayer`), so a second entry of the same type would
           initialise it twice with competing settings or double-send events. */
        rule.custom((trackers) => {
          const types = (trackers ?? []).map(
            (tracker) => (tracker as { _type?: string })._type,
          );
          const repeated = types.filter(
            (type, index) => type && types.indexOf(type) !== index,
          );
          return repeated.length === 0
            ? true
            : "Each provider can only be added once — remove the duplicate entry.";
        }),
      ],
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
    select: {
      title: "title",
      useCookieBanner: "useCookieBanner",
      loadMode: "loadMode",
    },
    prepare({ title, useCookieBanner, loadMode }) {
      return {
        title: title ?? "Analytics & Tracking",
        subtitle:
          useCookieBanner === false
            ? "No cookie banner"
            : loadMode === "onPageLoad"
              ? "Page load"
              : "Cookie banner",
      };
    },
  },
});
