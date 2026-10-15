import { defineArrayMember, defineField, defineType } from "sanity";

import { firstLocalizedLabel } from "../../utils/firstLocalizedLabel";

/** One section of the cookie preferences modal (`siteCookieBanner.preferencesModal.sections`). */
export const cookieSection = defineType({
  name: "cookieSection",
  title: "Cookie section",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "internationalizedArrayString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "internationalizedArrayText",
    }),
    defineField({
      name: "linkedCategory",
      title: "Consent category",
      description:
        "Gives the section a toggle. Necessary is always on; Analytics is the consent the gated trackers wait for. Empty = text only.",
      type: "string",
      options: {
        list: [
          { title: "Necessary", value: "necessary" },
          { title: "Analytics", value: "analytics" },
        ],
      },
    }),
    defineField({
      name: "cookies",
      title: "Cookies",
      description:
        "Shown as a table. The Analytics section also lists every tracker enabled under Analytics & Tracking.",
      type: "array",
      of: [
        defineArrayMember({
          name: "cookie",
          title: "Cookie",
          type: "object",
          fields: [
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "domain", title: "Domain", type: "string" }),
            defineField({
              name: "description",
              title: "Description",
              type: "internationalizedArrayString",
            }),
          ],
          preview: { select: { title: "name", subtitle: "domain" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", category: "linkedCategory" },
    prepare({ title, category }) {
      return {
        title: firstLocalizedLabel(title, "Section"),
        subtitle: category,
      };
    },
  },
});
