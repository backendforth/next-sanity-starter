import { defineCliConfig } from "sanity/cli";

import { studioDataset } from "./config/studioDataset";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = studioDataset;

export default defineCliConfig({
  api: {
    projectId: projectId ?? "",
    dataset,
  },
});
