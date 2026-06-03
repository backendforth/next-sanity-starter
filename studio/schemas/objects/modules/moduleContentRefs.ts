import { DocumentsIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { firstLocalizedLabel } from "../../../utils/firstLocalizedLabel";
import {
  type ContentRefSelectionMode,
  type ContentRefSourceScope,
  contentRefReferenceFilter,
  PAGE_REFERENCES,
  PROJECT_REFERENCES,
} from "../../constants/references";

type ContentRefsParent = {
  sourceScope?: ContentRefSourceScope;
  selection?: ContentRefSelectionMode;
};

function scopeFromParent(parent: ContentRefsParent | undefined) {
  return parent?.sourceScope ?? "all";
}

const SOURCE_SCOPE_LABELS: Record<ContentRefSourceScope, string> = {
  all: "All sources",
  pages: "Pages",
  projects: "Projects",
};

const SELECTION_LABELS: Record<ContentRefSelectionMode, string> = {
  all: "All documents",
  selected: "Selected only",
};

export const moduleContentRefs = defineType({
  name: "module.contentRefs",
  title: "Content references",
  type: "object",
  icon: DocumentsIcon,
  fields: [
    {
      name: "heading",
      title: "Heading",
      type: "internationalizedArrayString",
    },
    {
      name: "sourceScope",
      title: "Sources",
      description: "Which document types to include in this module.",
      type: "string",
      options: {
        list: [
          { title: "All sources", value: "all" },
          { title: "Pages", value: "pages" },
          { title: "Projects", value: "projects" },
        ],
        layout: "radio",
      },
      initialValue: "all",
      validation: (rule) => rule.required(),
    },
    {
      name: "showProjectFilters",
      title: "Show category filters",
      description: "Only applies when Sources is Projects.",
      type: "boolean",
      initialValue: true,
      hidden: ({ parent }) =>
        (parent as ContentRefsParent)?.sourceScope !== "projects",
    },
    {
      name: "selection",
      title: "Selection",
      description:
        "All: every document matching the source filter. Selected: hand-picked references only.",
      type: "string",
      options: {
        list: [
          { title: "All documents", value: "all" },
          { title: "Selected only", value: "selected" },
        ],
        layout: "radio",
      },
      initialValue: "selected",
      validation: (rule) => rule.required(),
    },
    {
      name: "references",
      title: "References",
      type: "array",
      of: [
        {
          type: "reference",
          weak: true,
          to: [...PAGE_REFERENCES, ...PROJECT_REFERENCES],
          options: {
            filter: ({ parent }) => ({
              filter: contentRefReferenceFilter(
                scopeFromParent(parent as ContentRefsParent),
              ),
            }),
          },
        },
      ],
      hidden: ({ parent }) =>
        (parent as ContentRefsParent)?.selection !== "selected",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as ContentRefsParent | undefined;
          if (parent?.selection !== "selected") return true;
          if (!Array.isArray(value) || value.length === 0) {
            return "Add at least one reference.";
          }
          return true;
        }),
    },
  ],
  preview: {
    select: {
      heading: "heading",
      sourceScope: "sourceScope",
      selection: "selection",
      showProjectFilters: "showProjectFilters",
      refCount: "references",
    },
    prepare({ heading, sourceScope, selection, showProjectFilters, refCount }) {
      const title = firstLocalizedLabel(heading, "Content references");
      const scopeLabel =
        SOURCE_SCOPE_LABELS[(sourceScope as ContentRefSourceScope) ?? "all"] ??
        "All sources";
      const selectionLabel =
        SELECTION_LABELS[
          (selection as ContentRefSelectionMode) ?? "selected"
        ] ?? "Selected only";
      const count = Array.isArray(refCount) ? refCount.length : 0;
      const filters =
        sourceScope === "projects" && showProjectFilters ? " · filters" : "";
      const subtitle =
        selection === "all"
          ? `${selectionLabel} · ${scopeLabel}${filters}`
          : `${selectionLabel} · ${scopeLabel}${filters} · ${count} ref${count === 1 ? "" : "s"}`;
      return {
        title,
        subtitle,
      };
    },
  },
});
