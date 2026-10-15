import { defineType } from "sanity";

/**
 * App-level link actions resolved in the frontend (scroll-to anchor, cookie preferences).
 */
export const linkFunctions = defineType({
  name: "linkFunctions",
  title: "Link function",
  type: "object",
  fields: [
    {
      name: "key",
      title: "Action",
      type: "string",
      options: {
        list: [
          { title: "Scroll to anchor", value: "scroll-to" },
          {
            title: "Cookie / Open preferences",
            value: "open-cookie-preferences",
          },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    },
    {
      /* Stored as `params`; the web reads it only as the `scroll-to` anchor (`navHref.ts`). */
      name: "params",
      title: "Anchor id",
      type: "string",
      description:
        "Id of the element to scroll to, e.g. contact (a leading # is optional).",
      hidden: ({ parent }) => parent?.key !== "scroll-to",
      validation: (rule) =>
        rule.custom((value: string | undefined, context) => {
          const parent = context.parent as { key?: string } | undefined;
          if (parent?.key === "scroll-to" && !value?.trim()) {
            return "Add the id to scroll to.";
          }
          return true;
        }),
    },
  ],
});
