import { CodeBlockIcon, StackIcon, ThLargeIcon } from "@sanity/icons";
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
      type: "boolean",
      initialValue: false,
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
          type: "string",
          initialValue:
            "Our website uses essential cookies to ensure proper operation and tracking cookies to understand your interaction. Tracking is only activated after consent.",
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
          type: "string",
          initialValue: "Reject",
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
          type: "string",
          initialValue: "Reject all",
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
