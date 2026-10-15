import { defineType } from "sanity";

/**
 * App-level link actions resolved in the frontend. Only the cookie-preferences opener ships;
 * site-specific actions (e.g. scroll to a section) are added per project.
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
          {
            title: "Cookie / Open preferences",
            value: "open-cookie-preferences",
          },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    },
  ],
});
