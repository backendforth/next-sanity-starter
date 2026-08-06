import { defineField, defineType } from "sanity";

export const trackerMicrosoftClarity = defineType({
  name: "trackerMicrosoftClarity",
  title: "Microsoft Clarity",
  type: "object",
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "projectId",
      title: "Project ID",
      description: "Clarity project ID from the Clarity dashboard.",
      type: "string",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { enabled?: boolean };
          if (!parent?.enabled) return true;
          if (!value?.trim()) return "Project ID is required when enabled.";
          return true;
        }),
    }),
    defineField({
      name: "cookieFree",
      title: "Cookie-free mode",
      description:
        "Clarity does not offer a fully cookie-free mode. When enabled, tracking still uses Clarity cookies — keep this off unless you accept reduced functionality.",
      type: "boolean",
      initialValue: false,
      readOnly: true,
    }),
    defineField({
      name: "cookieBannerLabel",
      title: "Cookie banner label",
      type: "string",
      initialValue: "Microsoft Clarity",
    }),
    defineField({
      name: "cookieBannerDescription",
      title: "Cookie banner description",
      type: "text",
      rows: 2,
      initialValue:
        "Session recordings and heatmaps to improve usability (Microsoft Clarity).",
    }),
  ],
  preview: {
    select: { enabled: "enabled", projectId: "projectId" },
    prepare({ enabled, projectId }) {
      return {
        title: `Microsoft Clarity${enabled === false ? " (disabled)" : ""}`,
        subtitle: projectId || "No project ID",
      };
    },
  },
});
