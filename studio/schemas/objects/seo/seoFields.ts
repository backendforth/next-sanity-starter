import { defineField } from "sanity";

import { IMAGE_COLOR_PROFILE_HINT } from "../../constants/media";

/** The fields of `seo.page` and `seo.fallback`; only the meta title's description differs. */
export function seoFields(titleDescription: string) {
  return [
    defineField({
      name: "title",
      title: "Meta title",
      type: "string",
      description: titleDescription,
      validation: (rule) => rule.warning().max(60),
    }),
    defineField({
      name: "description",
      title: "Meta description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.warning().max(160),
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
