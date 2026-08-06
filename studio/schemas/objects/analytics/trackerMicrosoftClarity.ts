import { defineField, defineType } from "sanity";
import { CONTROLLER_CHECKLIST } from "./complianceNotes";

export const trackerMicrosoftClarity = defineType({
  name: "trackerMicrosoftClarity",
  title: "Microsoft Clarity",
  type: "object",
  description:
    "Session recording: pointer, clicks, and DOM snapshots — can capture form input. Mask inputs in Clarity first. Data goes to Microsoft in the US. Systematic monitoring, so a DPIA may be required (GDPR Art. 35). " +
    CONTROLLER_CHECKLIST,
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      description:
        "On withdrawal the loaded script is not torn down and its cookies remain until the next page load.",
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
        "Not available — Clarity always uses cookies, so it never loads before consent.",
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
