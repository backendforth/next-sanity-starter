import { LinkIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { firstLocalizedLabel } from "../../utils/firstLocalizedLabel";
import {
  PAGE_REFERENCE_FILTER,
  PAGE_REFERENCES,
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
      type: "internationalizedArrayString",
      description:
        "Per-locale label. Optional for internal links — the referenced document title is used as fallback. Required for external and function links.",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { type?: string } | undefined;
          const t = parent?.type;
          if (t === "external" || t === "function") {
            const label = firstLocalizedLabel(value, "");
            if (!label) {
              return "Add a title in at least one language";
            }
          }
          return true;
        }),
    },
    {
      name: "reference",
      type: "reference",
      weak: true,
      to: [...PAGE_REFERENCES],
      options: {
        filter: PAGE_REFERENCE_FILTER,
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
      titleEntries: "title",
      refTitleEntries: "reference.title",
      referenceType: "reference._type",
      slug: "reference.slug.current",
      url: "url",
      funcKey: "func.key",
      funcParams: "func.params",
    },
    prepare(selection) {
      const {
        type,
        titleEntries,
        refTitleEntries,
        referenceType,
        slug,
        url,
        funcKey,
        funcParams,
      } = selection;

      let subtitle = "";
      if (type === "internal") {
        if (referenceType === "home") {
          subtitle = "→ /";
        } else if (referenceType === "page" && slug) {
          subtitle = `→ /${slug}`;
        } else if (referenceType === "project" && slug) {
          subtitle = `→ /work/${slug}`;
        } else if (referenceType === "work") {
          subtitle = "→ /work";
        } else if (referenceType) {
          subtitle = `→ (${referenceType})`;
        } else {
          subtitle = "(No reference)";
        }
      } else if (type === "external" && url) {
        subtitle = `→ ${url}`;
      } else if (type === "function") {
        subtitle = funcKey
          ? `→ ${funcKey}${funcParams ? ` (${funcParams})` : ""}`
          : "→ (function)";
      }

      const linkLabel = firstLocalizedLabel(titleEntries, "");
      const refLabel = firstLocalizedLabel(refTitleEntries, "");
      const title =
        linkLabel ||
        refLabel ||
        (type === "external" && typeof url === "string" ? url : "") ||
        (type === "function" && funcKey ? funcKey : "") ||
        "Link";

      return {
        title,
        subtitle,
      };
    },
  },
});
