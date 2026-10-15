/**
 * Sanity project id and dataset for every web reader: GROQ client, proxy, Visual Editing
 * attributes and image URLs. `next.config.ts` resolves the dataset once per build and inlines
 * both values through its `env` map into server, proxy and client bundles, so they are plain
 * literals everywhere — server and client compute identical image URLs (no hydration mismatch)
 * and images come from the dataset the content was queried from.
 */
export const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim() || "";
export const dataset = process.env.SANITY_STUDIO_DATASET?.trim() || "";
