import {
  resolveStudioDatasetAsync,
  type SanityDatasetResolveEnv,
} from "@repo/sanity-dataset-resolve";

/**
 * Env passed to the resolver must use **literal** `process.env.KEY` per field so Vite/Sanity
 * can replace values at build time in the hosted Studio bundle. Do not pass `process.env` or a
 * spread of it.
 */
function studioResolveEnv(): SanityDatasetResolveEnv {
  return {
    SANITY_STUDIO_DATASET: process.env.SANITY_STUDIO_DATASET,
    SANITY_STUDIO_PROJECT_ID: process.env.SANITY_STUDIO_PROJECT_ID,
    SANITY_STUDIO_DATASET_DEVELOPMENT:
      process.env.SANITY_STUDIO_DATASET_DEVELOPMENT,
    SANITY_STUDIO_DATASET_PRODUCTION:
      process.env.SANITY_STUDIO_DATASET_PRODUCTION,
    SANITY_STUDIO_DEPLOYMENT_TARGET:
      process.env.SANITY_STUDIO_DEPLOYMENT_TARGET,
  };
}

/**
 * Single resolved dataset for Studio config, CLI, and image URLs. `sanity.cli.ts` resolves it
 * first, with the host's build context, and writes it to `SANITY_STUDIO_DATASET`: every Studio
 * build and the dev server inline that name, so here the explicit value wins and nothing is
 * probed. The resolver only runs on its own where no Sanity CLI ran first.
 */
export const studioDataset = await resolveStudioDatasetAsync(
  studioResolveEnv(),
);
