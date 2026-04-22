/**
 * Env shape for `resolveStudioDatasetAsync` when running **Node** scripts (e.g. locale codegen).
 * Must stay aligned with `studio/config/sync/studioDataset.ts` (`studioResolveEnv` +
 * `resolvedDeploymentTarget`), except Vite’s `import.meta.env` is absent here — we use the
 * same fallback as the `studioDataset.ts` module **CLI / Node** branch (`NODE_ENV === "production"`).
 */
export function resolvedDeploymentTargetForNode() {
  const fromEnv = process.env.SANITY_STUDIO_DEPLOYMENT_TARGET?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  return undefined;
}

/** Same keys as `studioResolveEnv()` in `config/sync/studioDataset.ts` (literal env wiring). */
export function buildStudioResolveEnv() {
  return {
    SANITY_STUDIO_DATASET: process.env.SANITY_STUDIO_DATASET,
    SANITY_STUDIO_PROJECT_ID: process.env.SANITY_STUDIO_PROJECT_ID,
    SANITY_STUDIO_DATASET_DEVELOPMENT:
      process.env.SANITY_STUDIO_DATASET_DEVELOPMENT,
    SANITY_STUDIO_DATASET_PRODUCTION:
      process.env.SANITY_STUDIO_DATASET_PRODUCTION,
    SANITY_STUDIO_DEPLOYMENT_TARGET: resolvedDeploymentTargetForNode(),
    SANITY_STUDIO_DATASET_RESOLVER_TOKEN:
      process.env.SANITY_STUDIO_DATASET_RESOLVER_TOKEN,
    SANITY_AUTH_TOKEN: process.env.SANITY_AUTH_TOKEN,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NETLIFY: process.env.NETLIFY,
    CONTEXT: process.env.CONTEXT,
  };
}
