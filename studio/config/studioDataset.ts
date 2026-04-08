import { resolveStudioDatasetAsync } from "./resolveStudioDataset";

/**
 * Single resolved dataset for Studio config, CLI, and image URLs.
 * Resolved once when the module loads (build / dev server / CLI).
 */
export const studioDataset = await resolveStudioDatasetAsync(process.env);
