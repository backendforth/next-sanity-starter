import { LinkIcon } from "@sanity/icons/Link";
import { defineType } from "sanity";

import { PROJECT_URL_PREFIX } from "../../config/presentation/conventions";
import {
  LINK_REFERENCE_FILTER,
  LINK_REFERENCES,
  NEWEST_FIRST_SUGGESTIONS,
  sameLanguageReferenceFilter,
} from "../constants/references";

export const link = defineType({
  title: "Link",
  name: "link",
  type: "object",
  icon: LinkIcon,
  fields: [
    {
      title: "Type",
      name: "type",
      type: "string",
      initialValue: "internal",
      options: {
        list: [
          { title: "Internal", value: "internal" },
          { title: "External", value: "external" },
          { title: "Function", value: "function" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (rule) => rule.required(),
    },
    {
      title: "Title",
      name: "title",
      type: "string",
      description:
        "If empty for internal links, the referenced document title is used where available. Required for external and function links, except in rich text, where the marked text is the label.",
      validation: (rule) =>
        rule.custom((value, context) => {
          /* A rich-text link annotation (stored under `markDefs`) is labelled by its text. */
          if (context.path?.includes("markDefs")) {
            return true;
          }
          const parent = context.parent as { type?: string } | undefined;
          const t = parent?.type;
          if (t === "external" || t === "function") {
            const text = typeof value === "string" ? value.trim() : "";
            return text ? true : "Add a title.";
          }
          return true;
        }),
    },
    {
      name: "reference",
      type: "reference",
      weak: true,
      to: [...LINK_REFERENCES],
      options: {
        ...NEWEST_FIRST_SUGGESTIONS,
        filter: sameLanguageReferenceFilter(LINK_REFERENCE_FILTER),
      },
      hidden: ({ parent }) => parent?.type !== "internal",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          if (parent?.type === "internal" && !value) {
            return "Reference is required";
          }
          return true;
        }),
    },
    {
      name: "url",
      title: "URL",
      type: "url",
      hidden: ({ parent }) => parent?.type !== "external",
      validation: (rule) =>
        rule
          .custom((value, context) => {
            const parent = context.parent as { type?: string } | undefined;
            if (parent?.type === "external" && !value) {
              return "URL is required";
            }
            return true;
          })
          .uri({ scheme: ["http", "https", "mailto", "tel"] }),
    },
    {
      title: "Open in a new window?",
      name: "blank",
      type: "boolean",
      hidden: ({ parent }) => parent?.type !== "external",
      initialValue: true,
    },
    {
      name: "func",
      title: "Function",
      type: "linkFunctions",
      hidden: ({ parent }) => parent?.type !== "function",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          if (parent?.type === "function" && !value) {
            return "Function is required";
          }
          return true;
        }),
    },
  ],
  preview: {
    select: {
      type: "type",
      title: "title",
      refTitle: "reference.title",
      referenceType: "reference._type",
      slug: "reference.slug.current",
      url: "url",
      funcKey: "func.key",
    },
    prepare(selection) {
      const { type, title, refTitle, referenceType, slug, url, funcKey } =
        selection;

      let subtitle = "";
      if (type === "internal") {
        if (referenceType === "home") {
          subtitle = "→ /";
        } else if (referenceType === "page" && slug) {
          subtitle = `→ /${slug}`;
        } else if (referenceType === "project" && slug) {
          subtitle = `→ ${PROJECT_URL_PREFIX}/${slug}`;
        } else if (referenceType === "work") {
          subtitle = `→ ${PROJECT_URL_PREFIX}`;
        } else if (referenceType) {
          subtitle = `→ (${referenceType})`;
        } else {
          subtitle = "(No reference)";
        }
      } else if (type === "external" && url) {
        subtitle = `→ ${url}`;
      } else if (type === "function") {
        subtitle = funcKey ? `→ ${funcKey}` : "→ (function)";
      }

      const linkLabel = typeof title === "string" ? title.trim() : "";
      const refLabel = typeof refTitle === "string" ? refTitle.trim() : "";
      const label =
        linkLabel ||
        refLabel ||
        (type === "external" && typeof url === "string" ? url : "") ||
        (type === "function" && funcKey ? funcKey : "") ||
        "Link";

      return {
        title: label,
        subtitle,
      };
    },
  },
});
