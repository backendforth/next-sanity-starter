import createImageUrlBuilder from "@sanity/image-url";

import { getStudioEnv } from "./env";

const { projectId, dataset } = getStudioEnv();

/**
 * Image URL builder for previews and components. Requires SANITY_STUDIO_PROJECT_ID at runtime.
 */
export const urlForImage = createImageUrlBuilder({
  projectId: projectId ?? "",
  dataset,
});
