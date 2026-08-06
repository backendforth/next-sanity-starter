import { defineField, defineType } from "sanity";
import { CONTROLLER_CHECKLIST } from "./complianceNotes";

export const trackerMicrosoftClarity = defineType({
  name: "trackerMicrosoftClarity",
  title: "Microsoft Clarity",
  type: "object",
  description:
    "Highest-risk provider here. Clarity records sessions — pointer movement, clicks, scrolls, and DOM snapshots of what the visitor sees — so anything on screen can end up in a recording, including text typed into a form. Mask every input and any element that can display personal data in Clarity's settings first. Systematic monitoring of visitor behaviour is one of the GDPR Art. 35 criteria, so consider whether a data protection impact assessment is needed. Data goes to Microsoft in the US. " +
    CONTROLLER_CHECKLIST,
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      description:
        "Known limitation on withdrawal: when a visitor revokes analytics consent the site stops further Clarity API calls, but the already-loaded Clarity script is not torn down and its cookies are not removed until the visitor reloads the page.",
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
        "Not available — Clarity has no cookie-free mode, so it must never load before consent. Locked off deliberately: the site treats cookie-free trackers as safe to start early, and Clarity does not qualify.",
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
