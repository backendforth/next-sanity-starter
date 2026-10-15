import { LockIcon } from "@sanity/icons/Lock";
import { StackIcon } from "@sanity/icons/Stack";
import { ThLargeIcon } from "@sanity/icons/ThLarge";
import { defineType } from "sanity";

/** An empty text is not hidden: the web shows its default text in the visitor's language. */
const EMPTY_TEXT_HINT = "Empty texts show the default text.";

/**
 * Cookie banner copy. Whether the banner shows is `useCookieBanner` in `siteAnalyticsSettings`,
 * next to the trackers it gates. Web Preview is disabled in Presentation (see
 * `DOCUMENT_TYPES_WITHOUT_WEB_PREVIEW` in `config/presentation/conventions.ts`).
 */
export const siteCookieBanner = defineType({
  name: "siteCookieBanner",
  type: "document",
  title: "Cookie Banner",
  icon: LockIcon,
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
      initialValue: "Cookie Banner",
      hidden: true,
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
          type: "internationalizedArrayText",
        },
        {
          title: "Privacy Policy",
          name: "privacyPolicy",
          description:
            "Linked after the description: visitors must be able to read what they are agreeing to before they agree. A page link gets the visitor's language prefix. The link title is the label.",
          type: "link",
          validation: (rule) => [
            rule.custom(
              (value: { type?: string; url?: string } | undefined) => {
                if (value?.type === "function") {
                  return "Link to a page or a URL.";
                }
                /* The banner renders page links and http(s) URLs only (`privacyPolicyHtml`). */
                if (
                  value?.type === "external" &&
                  value.url &&
                  !/^https?:\/\//i.test(value.url)
                ) {
                  return "Use an http(s) URL: the banner shows no mailto: or tel: link.";
                }
                return true;
              },
            ),
            /* A warning: a site that keeps the banner off must still publish its copy. */
            rule
              .warning()
              .custom((value) =>
                value ? true : "Without this the banner has no policy link.",
              ),
          ],
        },
        {
          title: "Accept All Button",
          name: "acceptAllBtn",
          type: "internationalizedArrayString",
        },
        {
          title: "Accept Necessary Button",
          name: "acceptNecessaryBtn",
          description:
            "Reject button. Always shown — consent without a way to refuse is invalid.",
          type: "internationalizedArrayString",
        },
        {
          title: "Show Preferences Button",
          name: "showPreferencesBtn",
          type: "internationalizedArrayString",
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
          type: "internationalizedArrayString",
        },
        {
          title: "Accept All Button",
          name: "acceptAllBtn",
          type: "internationalizedArrayString",
        },
        {
          title: "Accept Necessary Button",
          name: "acceptNecessaryBtn",
          description: "Reject button. Always shown.",
          type: "internationalizedArrayString",
        },
        {
          title: "Save Preferences Button",
          name: "savePreferencesBtn",
          type: "internationalizedArrayString",
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
