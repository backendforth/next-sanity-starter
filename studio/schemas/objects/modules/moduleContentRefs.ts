import { DocumentsIcon } from "@sanity/icons";
import { defineType } from "sanity";

import {
  PAGE_REFERENCE_FILTER,
  PAGE_REFERENCES,
} from "../../constants/references";

export const moduleContentRefs = defineType({
  name: "module.contentRefs",
  title: "Content references",
  type: "object",
  icon: DocumentsIcon,
  fields: [
    {
      name: "heading",
      title: "Heading",
      type: "string",
    },
    {
      name: "allowMultiple",
      title: "Allow multiple references",
      type: "boolean",
      initialValue: false,
    },
    {
      name: "reference",
      title: "Page reference",
      type: "reference",
      weak: true,
      to: [...PAGE_REFERENCES],
      options: {
        filter: PAGE_REFERENCE_FILTER,
      },
      hidden: ({ parent }) => parent?.allowMultiple === true,
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as
            | { allowMultiple?: boolean }
            | undefined;
          if (!parent?.allowMultiple && !value) {
            return "Select a page reference.";
          }
          return true;
        }),
    },
    {
      name: "references",
      title: "Page references",
      type: "array",
      of: [
        {
          type: "reference",
          weak: true,
          to: [...PAGE_REFERENCES],
          options: {
            filter: PAGE_REFERENCE_FILTER,
          },
        },
      ],
      hidden: ({ parent }) => !parent?.allowMultiple,
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as
            | { allowMultiple?: boolean }
            | undefined;
          if (parent?.allowMultiple) {
            if (!Array.isArray(value) || value.length === 0) {
              return "Add at least one page reference.";
            }
          }
          return true;
        }),
    },
  ],
  preview: {
    select: {
      heading: "heading",
      allowMultiple: "allowMultiple",
    },
    prepare({ heading, allowMultiple }) {
      const title =
        typeof heading === "string" && heading.trim()
          ? heading
          : "Content references";
      const mode =
        allowMultiple === true ? "Multiple references" : "Single reference";
      return {
        title,
        subtitle: mode,
      };
    },
  },
});
