import { defineField, defineType } from "sanity";

export const trackerGoogleAnalytics = defineType({
  name: "trackerGoogleAnalytics",
  title: "Google Analytics",
  type: "object",
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
        "Uses gtag with client_storage: none — no analytics cookies in the browser. Suitable when respecting the cookie banner.",
      type: "boolean",
      initialValue: false,
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
