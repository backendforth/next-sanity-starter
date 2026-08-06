import { ChartUpwardIcon } from "@sanity/icons/ChartUpward";
import {
  defineArrayMember,
  defineField,
  defineType,
  type ValidationContext,
} from "sanity";

type TrackerValue = { enabled?: boolean };

/** Enabled trackers only — `enabled` is opt-out, so a missing flag counts as on. */
function enabledTrackerCount(trackers: unknown): number {
  if (!Array.isArray(trackers)) return 0;
  return trackers.filter(
    (tracker) => (tracker as TrackerValue)?.enabled !== false,
  ).length;
}

/**
 * Whether the cookie banner is switched on, read from its singleton.
 *
 * The two settings that decide whether anything is gated by consent live in
 * separate documents, so an editor can leave tracking completely ungated
 * without ever seeing the other half of the configuration. Reading across lets
 * us warn where the mistake is actually made.
 */
async function cookieBannerIsActive(
  context: ValidationContext,
): Promise<boolean> {
  const client = context.getClient({ apiVersion: "2024-01-01" });
  const useCookieBanner = await client.fetch<boolean | null>(
    `coalesce(
      *[_id == "drafts.siteCookieBanner"][0].useCookieBanner,
      *[_id == "siteCookieBanner"][0].useCookieBanner,
      false
    )`,
  );
  return useCookieBanner === true;
}

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
        "Respect cookie banner (recommended): cookie-based trackers wait for consent, cookie-free ones load immediately. Load on page load: everything runs before consent — unlawful in the EEA/UK for any tracker using cookies or device storage (ePrivacy Art. 5(3)).",
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
      validation: (rule) =>
        rule.warning().custom(async (trackers, context) => {
          const count = enabledTrackerCount(trackers);
          if (count === 0) return true;
          if (await cookieBannerIsActive(context)) return true;
          return `Cookie banner is off, so ${count === 1 ? "1 tracker runs" : `${count} trackers run`} with no consent. Loading mode has no effect without a banner.`;
        }),
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
