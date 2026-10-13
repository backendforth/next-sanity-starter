import { defineCliConfig } from "sanity/cli";

import { studioDataset } from "./config/sync/studioDataset";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = studioDataset;

/**
 * Hosted Studio deployment, so `pnpm studio:deploy` updates the existing deployment
 * instead of prompting for a hostname. The id belongs to one Sanity project — forks have
 * their own — so it comes from the env, never from source. `sanity deploy` prints it after
 * the first deploy; it is also listed under the project's Studios in sanity.io/manage.
 */
const appId = process.env.SANITY_STUDIO_APP_ID?.trim();

export default defineCliConfig({
  api: {
    projectId: projectId ?? "",
    dataset,
  },
  ...(appId ? { deployment: { appId } } : {}),
});
