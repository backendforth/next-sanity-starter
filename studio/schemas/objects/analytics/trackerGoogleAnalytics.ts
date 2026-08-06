import { defineField, defineType } from "sanity";
import { CONTROLLER_CHECKLIST } from "./complianceNotes";

export const trackerGoogleAnalytics = defineType({
  name: "trackerGoogleAnalytics",
  title: "Google Analytics",
  type: "object",
  description:
    "Sends visitor data to Google in the US. Needs a Google Analytics data processing amendment and a documented transfer basis (Google self-certifies under the EU-US Data Privacy Framework). Several EU regulators have found specific GA deployments unlawful, so check the current position for your jurisdiction rather than assuming the DPF settles it. " +
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
        "Sets client_storage: 'none' so GA4 writes no cookies — and, because the site treats cookie-free trackers as safe to start early, this also makes Google Analytics load before the visitor answers the banner. GA4 still sends the full hit, including the IP address, to Google in the US. Two things worth knowing: anonymize_ip has no effect in GA4 (it was a Universal Analytics setting), and turning this on is the riskiest combination available in this document — personal data reaching a US processor with no consent. Prefer leaving it off and letting GA wait for consent.",
      type: "boolean",
      initialValue: false,
      validation: (rule) =>
        rule.warning().custom((value) => {
          if (value !== true) return true;
          return "Cookie-free mode makes Google Analytics load before consent while still sending IP addresses to Google in the US. Only keep this on if that transfer has been assessed and documented.";
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
