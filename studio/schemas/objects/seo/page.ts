import { defineType, type Rule } from "sanity";
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

export const seoPage = defineType({
  name: "seo.page",
  title: "SEO",
  type: "object",
  fields: [
    {
      name: "title",
      title: "Meta title",
      type: "internationalizedArrayString",
      description: "Override for <title> and Open Graph title.",
      validation: localizedMaxLengthWarning(60, "Meta title"),
    },
    {
      name: "description",
      title: "Meta description",
      type: "internationalizedArrayText",
      validation: localizedMaxLengthWarning(160, "Meta description"),
    },
    {
      name: "image",
      title: "Social / OG image",
      type: "image",
      description: IMAGE_COLOR_PROFILE_HINT,
      options: {
        hotspot: true,
      },
    },
  ],
});

export const seoFallback = defineType({
  name: "seo.fallback",
  title: "SEO Fallback",
  type: "object",
  fields: [
    {
      name: "title",
      title: "Meta title",
      type: "internationalizedArrayString",
      description: "Default <title> and Open Graph title.",
      validation: localizedMaxLengthWarning(60, "Meta title"),
    },
    {
      name: "description",
      title: "Meta description",
      type: "internationalizedArrayText",
      validation: localizedMaxLengthWarning(160, "Meta description"),
    },
    {
      name: "image",
      title: "Social / OG image",
      type: "image",
      description: IMAGE_COLOR_PROFILE_HINT,
      options: {
        hotspot: true,
      },
    },
  ],
});
