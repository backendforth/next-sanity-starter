import { defineField, defineType } from "sanity";
import { CONTROLLER_CHECKLIST, COOKIE_FREE_NOTE } from "./complianceNotes";

export const trackerPostHog = defineType({
  name: "trackerPostHog",
  title: "PostHog",
  type: "object",
  description:
    "Important: session replay, autocapture, and heatmaps are switched on in the PostHog project settings, not here. If replay is enabled there, PostHog records visitor sessions with the same risks as Microsoft Clarity — and nothing in this document will tell you, so the banner description you write below can understate what is actually collected. Check the PostHog project before enabling. " +
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
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { enabled?: boolean };
          if (!parent?.enabled) return true;
          if (!value?.trim()) return "API key is required when enabled.";
          return true;
        }),
    }),
    defineField({
      name: "apiHost",
      title: "API host",
      description:
        "PostHog ingest host. Keep this on the EU cloud (https://eu.i.posthog.com) or your own self-hosted instance — pointing it at the US cloud (us.i.posthog.com) turns every event into a third-country transfer that needs its own basis.",
      type: "url",
      initialValue: "https://eu.i.posthog.com",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { enabled?: boolean };
          if (!parent?.enabled) return true;
          if (!value?.trim()) return "API host is required when enabled.";
          return true;
        }),
    }),
    defineField({
      name: "cookieFree",
      title: "Cookie-free mode",
      description: `Uses in-memory persistence only, so no PostHog cookies or localStorage entries are written, and every page load counts as a new anonymous user. ${COOKIE_FREE_NOTE}`,
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
      type: "text",
      rows: 2,
      initialValue: "Product analytics and feature flags via PostHog.",
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
