import { CodeBlockIcon } from "@sanity/icons/CodeBlock";
import { StackIcon } from "@sanity/icons/Stack";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { defineType } from "sanity";
import { defaultCookieSections } from "../../utils/defaultCookieSections";

/** Cookie banner copy. Web Preview is disabled in Presentation (see `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW` in `config/presentation/conventions.ts`). */
export const siteCookieBanner = defineType({
  name: "siteCookieBanner",
  type: "document",
  title: "Cookie Banner",
  icon: CodeBlockIcon,
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
      initialValue: "Cookie Banner",
      hidden: true,
    },
    {
      title: "Use Cookie Banner",
      name: "useCookieBanner",
      description:
        "Off does not stop tracking — it removes the gate. Every tracker enabled under Analytics & Tracking then loads with no consent, whatever its loading mode.",
      type: "boolean",
      initialValue: false,
      validation: (rule) =>
        rule.warning().custom(async (value, context) => {
          if (value === true) return true;
          const client = context.getClient({ apiVersion: "2024-01-01" });
          const trackers = await client.fetch<{ enabled?: boolean }[] | null>(
            `coalesce(
              *[_id == "drafts.siteAnalyticsSettings"][0].trackers,
              *[_id == "siteAnalyticsSettings"][0].trackers,
              []
            )`,
          );
          const count = (trackers ?? []).filter(
            (tracker) => tracker?.enabled !== false,
          ).length;
          if (count === 0) return true;
          return `${count === 1 ? "1 tracker is" : `${count} trackers are`} enabled under Analytics & Tracking and will run with no consent.`;
        }),
    },
    {
      title: "Consent Modal Texts",
      name: "consentModal",
      type: "object",
      icon: StackIcon,
      fields: [
        {
          title: "Description",
          name: "description",
          description:
            "Must name the controller and say why (GDPR Art. 13). Plain text — it is escaped before rendering; use the policy link fields below rather than HTML. Note any provider outside the EEA.",
          type: "string",
          initialValue:
            "Our website uses essential cookies for basic operation. Cookie-based analytics run only after you accept them; privacy-friendly analytics without cookies may load earlier.",
        },
        {
          title: "Privacy Policy URL",
          name: "privacyPolicyUrl",
          description:
            "Linked from the banner. Visitors must be able to read what they are agreeing to before they agree.",
          type: "url",
          options: { allowRelative: true },
          initialValue: "/privacy",
          validation: (rule) =>
            rule
              .warning()
              .required()
              .error("Without this the banner has no policy link."),
        },
        {
          title: "Privacy Policy Link Label",
          name: "privacyPolicyLabel",
          type: "string",
          initialValue: "Privacy policy",
        },
        {
          title: "Accept All Button",
          name: "acceptAllBtn",
          type: "string",
          initialValue: "Accept",
        },
        {
          title: "Accept Necessary Button",
          name: "acceptNecessaryBtn",
          description:
            "Reject button. An empty label removes the button entirely, leaving Accept as the only option — which invalidates the consent.",
          type: "string",
          initialValue: "Reject",
          validation: (rule) =>
            rule
              .required()
              .error("Required — an empty label hides the reject button."),
        },
        {
          title: "Show Preferences Button",
          name: "showPreferencesBtn",
          type: "string",
          initialValue: "Manage preferences",
        },
      ],
    },
    {
      title: "Preferences Modal Texts",
      name: "preferencesModal",
      type: "object",
      icon: ThLargeIcon,
      fields: [
        {
          title: "Title",
          name: "title",
          type: "string",
          initialValue: "Cookie preferences",
        },
        {
          title: "Accept All Button",
          name: "acceptAllBtn",
          type: "string",
          initialValue: "Accept all",
        },
        {
          title: "Accept Necessary Button",
          name: "acceptNecessaryBtn",
          description: "Reject button. An empty label removes it entirely.",
          type: "string",
          initialValue: "Reject all",
          validation: (rule) =>
            rule
              .required()
              .error("Required — an empty label hides the reject button."),
        },
        {
          title: "Save Preferences Button",
          name: "savePreferencesBtn",
          type: "string",
          initialValue: "Save preferences",
        },
        {
          title: "Sections",
          name: "sections",
          description:
            "Analytics rows are appended from the enabled trackers. Generated rows show the provider domain, not the real cookie host, and no durations — add exact names and retention if your jurisdiction expects them.",
          type: "code",
          options: {
            language: "json",
            languageAlternatives: [
              { title: "JSON", value: "json", mode: "json" },
            ],
          },
          initialValue: defaultCookieSections,
        },
      ],
    },
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return {
        title: title ?? "Cookie Banner",
      };
    },
  },
});
