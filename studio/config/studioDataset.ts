import {
  resolveStudioDatasetAsync,
  type SanityDatasetResolveEnv,
} from "@repo/sanity-dataset-resolve";

/**
 * `SANITY_STUDIO_DEPLOYMENT_TARGET` from env (Shell / .env at build time), else inferred:
 * - `sanity dev`: unset → resolver prefers **development** first (mutual fallback with production).
 * - Production **bundle** (hosted Studio): env is often empty in the browser → if Vite
 *   `import.meta.env.PROD`, treat as **production**-first so deploy matches `pnpm run deploy`.
 * Override always wins: set `SANITY_STUDIO_DATASET` or `SANITY_STUDIO_DEPLOYMENT_TARGET` in .env / CI.
 */
function resolvedDeploymentTarget(): string | undefined {
  const fromEnv = process.env.SANITY_STUDIO_DEPLOYMENT_TARGET?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  // Vite (Studio UI bundle): dev server → let resolver prefer development first.
  if (import.meta.env?.DEV === true) {
    return undefined;
  }
  if (import.meta.env?.PROD === true) {
    return "production";
  }
  // CLI / Node eval without `import.meta.env`: `pnpm run deploy` still sets SANITY_STUDIO_DEPLOYMENT_TARGET; else build uses NODE_ENV.
  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  return undefined;
}

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
    SANITY_STUDIO_DEPLOYMENT_TARGET: resolvedDeploymentTarget(),
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
