import { defineField, type Rule } from "sanity";

import { IMAGE_COLOR_PROFILE_HINT } from "../../constants/media";

type LocalizedEntry = { _key?: string; language?: string; value?: unknown };

/**
 * Length warning for `internationalizedArray*` fields: names the first
 * language whose value runs over `max` (search engines truncate beyond it).
 */
function localizedMaxLengthWarning(max: number, label: string) {
  return (rule: Rule) =>
    rule
      .custom((entries: LocalizedEntry[] | undefined) => {
        for (const entry of entries ?? []) {
          const value = typeof entry?.value === "string" ? entry.value : "";
          if (value.length <= max) continue;
          const language = entry.language || entry._key || "?";
          return `${label} (${language}) is ${value.length} characters — keep it under ${max}.`;
        }
        return true;
      })
      .warning();
}

/** The fields of `seo.page` and `seo.fallback`; only the meta title's description differs. */
export function seoFields(titleDescription: string) {
  return [
    defineField({
      name: "title",
      title: "Meta title",
      type: "internationalizedArrayString",
      description: titleDescription,
      validation: localizedMaxLengthWarning(60, "Meta title"),
    }),
    defineField({
      name: "description",
      title: "Meta description",
      type: "internationalizedArrayText",
      validation: localizedMaxLengthWarning(160, "Meta description"),
    }),
    defineField({
      name: "image",
      title: "Social / OG image",
      type: "image",
      description: IMAGE_COLOR_PROFILE_HINT,
      options: {
        hotspot: true,
      },
    }),
  ];
}
