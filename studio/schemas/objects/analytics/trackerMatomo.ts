import { defineField, defineType } from "sanity";

export const trackerMatomo = defineType({
  name: "trackerMatomo",
  title: "Matomo (self-hosted)",
  type: "object",
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
      description:
        "Calls Matomo disableCookies — tracking without first-party analytics cookies.",
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
