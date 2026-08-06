import { defineField, defineType } from "sanity";

export const trackerPostHog = defineType({
  name: "trackerPostHog",
  title: "PostHog",
  type: "object",
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
        "PostHog ingest host (e.g. https://eu.i.posthog.com or your self-hosted URL).",
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
      description:
        "Uses in-memory persistence only — no PostHog cookies stored in the browser.",
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
