import { defineType } from "sanity";

/**
 * App-level link actions resolved in the frontend (e.g. scroll, modal).
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
          { title: "Open modal", value: "open-modal" },
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
      name: "params",
      title: "Parameters",
      type: "string",
      description: "Optional id, JSON, or query string for the handler.",
    },
  ],
});
