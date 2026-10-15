import { defineField, defineType } from "sanity";
import { COOKIE_FREE_NOTE } from "./complianceNotes";
import { requiredWhenEnabled } from "./requiredWhenEnabled";

export const trackerMatomo = defineType({
  name: "trackerMatomo",
  title: "Matomo (self-hosted)",
  type: "object",
  description:
    "Self-hosted — you are the controller and there is no third-party transfer. Set IP anonymisation and a retention period in Matomo, and name it in your privacy policy.",
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
        "Base URL of your Matomo instance (e.g. https://analytics.example.com/). Add its origin to the CSP_ANALYTICS_ORIGINS build variable of the web app, or the browser blocks it.",
      type: "url",
      validation: (rule) => rule.custom(requiredWhenEnabled("Matomo URL")),
    }),
    defineField({
      name: "siteId",
      title: "Site ID",
      type: "string",
      validation: (rule) => rule.custom(requiredWhenEnabled("Site ID")),
    }),
    defineField({
      name: "cookieFree",
      title: "Cookie-free mode",
      description: `Calls disableCookies, so no analytics cookies are set. ${COOKIE_FREE_NOTE}`,
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
      description:
        "Shown in every language. Empty = the default text in the visitor's language.",
      type: "text",
      rows: 2,
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
