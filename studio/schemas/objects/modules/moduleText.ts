import { TextIcon } from "@sanity/icons/Text";
import { defineType } from "sanity";
import { plainLabel } from "../../../utils/plainLabel";

export const moduleText = defineType({
  name: "module.text",
  title: "Text",
  type: "object",
  icon: TextIcon,
  fields: [
    {
      name: "heading",
      title: "Heading",
      type: "string",
    },
    {
      name: "body",
      title: "Body",
      type: "richTextMedia",
    },
  ],
  preview: {
    select: {
      heading: "heading",
    },
    prepare({ heading }) {
      return {
        title: plainLabel(heading, "Text"),
        subtitle: "Text module",
      };
    },
  },
});
