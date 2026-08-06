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
        "Turning this off does not stop tracking — it removes the gate. With no banner there is no consent to wait for, so every tracker enabled under Analytics & Tracking loads immediately regardless of its loading mode. Keep this on whenever a tracker is enabled and the site has EEA/UK visitors.",
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
          return `${count === 1 ? "A tracker is" : `${count} trackers are`} enabled under Analytics & Tracking and will run with no consent while the banner is off.`;
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
            'Shown in the banner. To be transparent under GDPR Art. 13 this should say who is collecting the data and why, and link to your privacy or cookie policy — HTML is rendered here, so `<a href="/privacy">Privacy policy</a>` works. If a provider sends data outside the EEA (Google Analytics, Microsoft Clarity), say so.',
          type: "string",
          initialValue:
            "Our website uses essential cookies to ensure proper operation and tracking cookies to understand your interaction. Tracking is only activated after consent.",
          validation: (rule) =>
            rule.warning().custom((value) => {
              if (typeof value !== "string" || value.includes("href=")) {
                return true;
              }
              return "No link found. The banner should link to your privacy or cookie policy so visitors can see what they are consenting to.";
            }),
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
            "The reject button. Must stay filled in: the banner library only renders this button when the label is non-empty, so clearing it leaves Accept as the only option — refusing consent has to be as easy as giving it, and regulators treat a missing reject button as invalid consent.",
          type: "string",
          initialValue: "Reject",
          validation: (rule) =>
            rule
              .required()
              .error(
                "Required — an empty label hides the reject button entirely, which makes the consent invalid.",
              ),
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
          description:
            "The reject button in the preferences dialog. As above, an empty label removes the button.",
          type: "string",
          initialValue: "Reject all",
          validation: (rule) =>
            rule
              .required()
              .error(
                "Required — an empty label hides the reject button entirely, which makes the consent invalid.",
              ),
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
            "Rows for the analytics category are appended automatically from the enabled trackers. Two caveats if your jurisdiction expects an exact cookie disclosure: the generated rows show the provider's own domain, whereas cookies like _ga are actually set on your domain, and no retention period is shown. Add precise names and durations here when that matters.",
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
