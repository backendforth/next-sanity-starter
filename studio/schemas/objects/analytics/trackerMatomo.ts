import { defineField, defineType } from "sanity";
import { COOKIE_FREE_NOTE } from "./complianceNotes";

export const trackerMatomo = defineType({
  name: "trackerMatomo",
  title: "Matomo (self-hosted)",
  type: "object",
  description:
    "Lowest-risk option here: self-hosted, so the analytics data stays with you and there is no third-party processor or transfer to account for. You are the controller for it. Two things to set on the Matomo side: anonymise IP addresses (Administration → Privacy → Anonymize data) and set a data retention period. Still name it in your privacy policy.",
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "url",
      title: "Matomo URL",
      description:
        "Base URL of your Matomo instance (e.g. https://analytics.example.com/). Add this host to Content-Security-Policy in netlify.toml.",
      type: "url",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { enabled?: boolean };
          if (!parent?.enabled) return true;
          if (!value?.trim()) return "Matomo URL is required when enabled.";
          return true;
        }),
    }),
    defineField({
      name: "siteId",
      title: "Site ID",
      type: "string",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { enabled?: boolean };
          if (!parent?.enabled) return true;
          if (!value?.trim()) return "Site ID is required when enabled.";
          return true;
        }),
    }),
    defineField({
      name: "cookieFree",
      title: "Cookie-free mode",
      description: `Calls Matomo's disableCookies, so no first-party analytics cookies are set. ${COOKIE_FREE_NOTE}`,
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "cookieBannerLabel",
      title: "Cookie banner label",
      type: "string",
      initialValue: "Matomo",
    }),
    defineField({
      name: "cookieBannerDescription",
      title: "Cookie banner description",
      type: "text",
      rows: 2,
      initialValue:
        "Privacy-friendly analytics via your self-hosted Matomo instance.",
    }),
  ],
  preview: {
    select: { enabled: "enabled", url: "url", siteId: "siteId" },
    prepare({ enabled, url, siteId }) {
      return {
        title: `Matomo${enabled === false ? " (disabled)" : ""}`,
        subtitle: url ? `${url} — site ${siteId ?? "?"}` : "No URL configured",
      };
    },
  },
});
