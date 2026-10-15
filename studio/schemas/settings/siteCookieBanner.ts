import { CodeBlockIcon } from "@sanity/icons/CodeBlock";
import { StackIcon } from "@sanity/icons/Stack";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { defineType } from "sanity";

/** An empty text is not hidden: the web shows its default text in the visitor's language. */
const EMPTY_TEXT_HINT = "Empty texts show the default text.";

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
      description: EMPTY_TEXT_HINT,
      fields: [
        {
          title: "Description",
          name: "description",
          description:
            "Must name the controller and say why (GDPR Art. 13). Plain text — it is escaped before rendering; the policy link below is appended. Note any provider outside the EEA.",
          type: "string",
        },
        {
          title: "Privacy Policy",
          name: "privacyPolicy",
          description:
            "Linked after the description: visitors must be able to read what they are agreeing to before they agree. A page link gets the visitor's language prefix. The link title is the label.",
          type: "link",
          validation: (rule) => [
            rule
              .required()
              .error("Without this the banner has no policy link."),
            rule.custom((value: { type?: string } | undefined) =>
              value?.type === "function" ? "Link to a page or a URL." : true,
            ),
          ],
        },
        {
          title: "Accept All Button",
          name: "acceptAllBtn",
          type: "string",
        },
        {
          title: "Accept Necessary Button",
          name: "acceptNecessaryBtn",
          description:
            "Reject button. Always shown — consent without a way to refuse is invalid.",
          type: "string",
        },
        {
          title: "Show Preferences Button",
          name: "showPreferencesBtn",
          type: "string",
        },
      ],
    },
    {
      title: "Preferences Modal Texts",
      name: "preferencesModal",
      type: "object",
      icon: ThLargeIcon,
      description: EMPTY_TEXT_HINT,
      fields: [
        {
          title: "Title",
          name: "title",
          type: "string",
        },
        {
          title: "Accept All Button",
          name: "acceptAllBtn",
          type: "string",
        },
        {
          title: "Accept Necessary Button",
          name: "acceptNecessaryBtn",
          description: "Reject button. Always shown.",
          type: "string",
        },
        {
          title: "Save Preferences Button",
          name: "savePreferencesBtn",
          type: "string",
        },
        {
          title: "Sections",
          name: "sections",
          description:
            "Empty = a Necessary and an Analytics section with the default text. The Analytics section lists every enabled tracker after its own cookies, and is added when trackers are enabled and no section has that category. Generated rows show the provider domain, not the real cookie host, and no durations — add exact names and retention if your jurisdiction expects them.",
          type: "array",
          of: [{ type: "cookieSection" }],
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
