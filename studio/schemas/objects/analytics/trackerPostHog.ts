import { defineField, defineType } from "sanity";
import { CONTROLLER_CHECKLIST, COOKIE_FREE_NOTE } from "./complianceNotes";
import { requiredWhenEnabled } from "./requiredWhenEnabled";

export const trackerPostHog = defineType({
  name: "trackerPostHog",
  title: "PostHog",
  type: "object",
  description:
    "Session replay and autocapture are configured in PostHog, not here — if replay is on, treat this like Microsoft Clarity. " +
    CONTROLLER_CHECKLIST,
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "apiKey",
      title: "Project API key",
      type: "string",
      validation: (rule) => rule.custom(requiredWhenEnabled("API key")),
    }),
    defineField({
      name: "apiHost",
      title: "API host",
      description:
        "Ingest host. Keep on the EU cloud (https://eu.i.posthog.com) or self-hosted; us.i.posthog.com is a US transfer. Self-hosted: add the origin to the CSP_ANALYTICS_ORIGINS build variable of the web app.",
      type: "url",
      initialValue: "https://eu.i.posthog.com",
      validation: (rule) => rule.custom(requiredWhenEnabled("API host")),
    }),
    defineField({
      name: "cookieFree",
      title: "Cookie-free mode",
      description: `No cookies or localStorage; every page load counts as a new anonymous user. ${COOKIE_FREE_NOTE}`,
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "cookieBannerLabel",
      title: "Cookie banner label",
      type: "string",
      initialValue: "PostHog",
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
    select: { enabled: "enabled", apiHost: "apiHost" },
    prepare({ enabled, apiHost }) {
      return {
        title: `PostHog${enabled === false ? " (disabled)" : ""}`,
        subtitle: apiHost || "No API host",
      };
    },
  },
});
