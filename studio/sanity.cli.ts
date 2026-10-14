import { defineCliConfig } from "sanity/cli";

import { studioDataset } from "./config/sync/studioDataset";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = studioDataset;

/**
 * Sanity-hosted deployment (`*.sanity.studio`), so `pnpm studio:deploy` updates the existing
 * deployment instead of prompting for a hostname. The id belongs to one Sanity project — forks
 * have their own — so it comes from the env, never from source. `sanity deploy` prints it after
 * the first deploy; it is also listed under the project's Studios in sanity.io/manage.
 *
 * The default hosting, Netlify (`netlify.toml`), doesn't use it: `pnpm studio:register`
 * clears it so the external URL is registered as its own Studio.
 */
const appId = process.env.SANITY_STUDIO_APP_ID?.trim();

export default defineCliConfig({
  api: {
    projectId: projectId ?? "",
    dataset,
  },
  ...(appId ? { deployment: { appId } } : {}),
});
