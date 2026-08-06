import { defineField, defineType } from "sanity";

export const trackerPlausible = defineType({
  name: "trackerPlausible",
  title: "Plausible Analytics",
  type: "object",
  description:
    "Least intrusive third-party option: no cookies, no cross-site identifiers, and Plausible Cloud is EU-hosted. Because it counts as cookie-free it loads before the visitor answers the banner. It does still process the IP address server-side to derive a daily visitor hash, so it needs a lawful basis — usually legitimate interest — and a mention in your privacy policy. Regulators generally accept this for plain audience measurement, but the assessment is yours to make and record.",
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "domain",
      title: "Domain",
      description: "Site domain registered in Plausible (e.g. example.com).",
      type: "string",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { enabled?: boolean };
          if (!parent?.enabled) return true;
          if (!value?.trim()) return "Domain is required when enabled.";
          return true;
        }),
    }),
    defineField({
      name: "scriptUrl",
      title: "Script URL",
      description:
        "Plausible script URL (default: https://plausible.io/js/script.js). Use your self-hosted URL if applicable.",
      type: "url",
      initialValue: "https://plausible.io/js/script.js",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { enabled?: boolean };
          if (!parent?.enabled) return true;
          if (!value?.trim()) return "Script URL is required when enabled.";
          return true;
        }),
    }),
    defineField({
      name: "cookieFree",
      title: "Cookie-free mode",
      description:
        "Always on — Plausible is cookie-free by design, which is why it loads without waiting for analytics consent. Locked so it cannot be switched off and misrepresent the provider in the cookie banner.",
      type: "boolean",
      initialValue: true,
      readOnly: true,
    }),
    defineField({
      name: "cookieBannerLabel",
      title: "Cookie banner label",
      type: "string",
      initialValue: "Plausible Analytics",
    }),
    defineField({
      name: "cookieBannerDescription",
      title: "Cookie banner description",
      type: "text",
      rows: 2,
      initialValue:
        "Privacy-friendly, cookie-less traffic analytics via Plausible.",
    }),
  ],
  preview: {
    select: { enabled: "enabled", domain: "domain" },
    prepare({ enabled, domain }) {
      return {
        title: `Plausible${enabled === false ? " (disabled)" : ""}`,
        subtitle: domain || "No domain",
      };
    },
  },
});
