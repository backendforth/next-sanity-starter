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
    SANITY_STUDIO_DATASET_RESOLVER_TOKEN:
      process.env.SANITY_STUDIO_DATASET_RESOLVER_TOKEN,
    SANITY_AUTH_TOKEN: process.env.SANITY_AUTH_TOKEN,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NETLIFY: process.env.NETLIFY,
    CONTEXT: process.env.CONTEXT,
  };
}

/**
 * Single resolved dataset for Studio config, CLI, and image URLs.
 * Resolved once when the module loads (build / dev server / CLI).
 */
export const studioDataset = await resolveStudioDatasetAsync(
  studioResolveEnv(),
);
