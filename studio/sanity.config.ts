import { dashboardTool, projectInfoWidget } from "@sanity/dashboard";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
import { media } from "sanity-plugin-media";
import { muxInput } from "sanity-plugin-mux-input";
import { netlifyTool } from "sanity-plugin-netlify";

import { initialValueTemplates } from "./config/initialValueTemplates";
import { structure } from "./config/structure";
import { schemaTypes } from "./schemas";
import {
  defaultLanguageIds,
  studioLanguages,
} from "./schemas/constants/languages";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET ?? "production";

if (!projectId) {
  throw new Error(
    "Missing SANITY_STUDIO_PROJECT_ID. Copy studio/.env.example to studio/.env and set your project ID.",
  );
}

export default defineConfig({
  name: "default",
  title: "Next Sanity Boilerplate",
  projectId,
  dataset,
  plugins: [
    dashboardTool({
      widgets: [projectInfoWidget()],
    }),
    structureTool({ structure }),
    visionTool(),
    media(),
    muxInput(),
    netlifyTool(),
    internationalizedArray({
      languages: [...studioLanguages],
      defaultLanguages: [...defaultLanguageIds],
      fieldTypes: ["string", "richText", "richTextMedia"],
    }),
  ],
  schema: {
    types: schemaTypes,
  },
  initialValueTemplates,
});
