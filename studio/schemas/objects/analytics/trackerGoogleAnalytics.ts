import { defineField, defineType } from "sanity";
import { CONTROLLER_CHECKLIST } from "./complianceNotes";

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
        rule.custom((value, context) => {
          const parent = context.parent as { enabled?: boolean };
          if (!parent?.enabled) return true;
          if (!value?.trim()) return "Measurement ID is required when enabled.";
          if (!/^G-[A-Z0-9]+$/i.test(value.trim())) {
            return "Use a valid GA4 measurement ID (G-XXXXXXXXXX).";
          }
          return true;
        }),
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
      type: "text",
      rows: 2,
      initialValue:
        "Helps us understand how visitors use the site via Google Analytics.",
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
