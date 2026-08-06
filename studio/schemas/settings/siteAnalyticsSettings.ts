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
        "Respect cookie banner (recommended): cookie-based trackers wait for analytics consent; trackers marked cookie-free still load immediately. Load on page load: every enabled tracker runs before the visitor has answered the banner — for EEA/UK visitors that is generally unlawful for any tracker that sets cookies or reads device storage (ePrivacy Art. 5(3)), so use it only after your own legal review.",
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
          return `"Load on page load" starts ${count === 1 ? "this tracker" : `all ${count} enabled trackers`} before the visitor consents, and the cookie banner is bypassed entirely. Unless legal has signed off on this specific setup, switch to "Respect cookie banner".`;
        }),
      ],
    }),
    defineField({
      name: "trackers",
      title: "Tracking providers",
      description:
        "Add one entry per provider. Only enabled providers with valid configuration are loaded on the site. Each provider carries its own privacy obligations — open the entry and read the notes there before switching it on.",
      type: "array",
      validation: (rule) =>
        rule.warning().custom(async (trackers, context) => {
          const count = enabledTrackerCount(trackers);
          if (count === 0) return true;
          if (await cookieBannerIsActive(context)) return true;
          return `The cookie banner is switched off in Cookie Banner settings, so ${count === 1 ? "this tracker runs" : `all ${count} enabled trackers run`} with no consent at all — the loading mode above has no effect without a banner to wait for. Switch "Use Cookie Banner" on, or disable the trackers.`;
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
