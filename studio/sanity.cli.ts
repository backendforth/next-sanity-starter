import { defineCliConfig } from "sanity/cli";

import { studioDataset } from "./config/sync/studioDataset";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = studioDataset;

export default defineCliConfig({
  api: {
    projectId: projectId ?? "",
    dataset,
  },
});
