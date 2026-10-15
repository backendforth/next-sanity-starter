import { defineField, defineType } from "sanity";
import { CONTROLLER_CHECKLIST } from "./complianceNotes";
import { requiredWhenEnabled } from "./requiredWhenEnabled";

export const trackerGoogleAnalytics = defineType({
  name: "trackerGoogleAnalytics",
  title: "Google Analytics",
  type: "object",
  description:
    "Sends data to Google in the US. Some EU regulators have ruled specific GA setups unlawful. " +
    CONTROLLER_CHECKLIST,
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "measurementId",
      title: "Measurement ID",
      description: "GA4 measurement ID (e.g. G-XXXXXXXXXX).",
      type: "string",
      validation: (rule) =>
        rule.custom(
          requiredWhenEnabled("Measurement ID", (value) =>
            /^G-[A-Z0-9]+$/i.test(value)
              ? true
              : "Use a valid GA4 measurement ID (G-XXXXXXXXXX).",
          ),
        ),
    }),
    defineField({
      name: "cookieFree",
      title: "Cookie-free mode",
      description:
        "No GA cookies (client_storage: 'none'), and loads before consent. The full hit including IP still goes to Google. Note: anonymize_ip is a no-op in GA4.",
      type: "boolean",
      initialValue: false,
      validation: (rule) =>
        rule.warning().custom((value) => {
          if (value !== true) return true;
          return "Sends IPs to Google in the US with no consent.";
        }),
    }),
    defineField({
      name: "cookieBannerLabel",
      title: "Cookie banner label",
      description: "Shown in cookie preferences for this provider.",
      type: "string",
      initialValue: "Google Analytics",
    }),
    defineField({
      name: "cookieBannerDescription",
      title: "Cookie banner description",
      description:
        "Shown in every language. Empty = the default text in the banner's language.",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: { enabled: "enabled", measurementId: "measurementId" },
    prepare({ enabled, measurementId }) {
      return {
        title: `Google Analytics${enabled === false ? " (disabled)" : ""}`,
        subtitle: measurementId || "No measurement ID",
      };
    },
  },
});
