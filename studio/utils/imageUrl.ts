import createImageUrlBuilder from "@sanity/image-url";

import { studioDataset } from "../config/sync/studioDataset";

/**
 * Image URL builder for previews and components. Requires SANITY_STUDIO_PROJECT_ID at runtime.
 */
export const urlForImage = createImageUrlBuilder({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "",
  dataset: studioDataset,
});
