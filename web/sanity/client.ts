import { createClient } from "next-sanity";

import { dataset, projectId } from "./sanityEnv";

if (!projectId || !dataset) {
	throw new Error(
		"Missing SANITY_STUDIO_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID) and/or could not resolve dataset — set SANITY_STUDIO_DATASET or SANITY_STUDIO_DATASET_DEVELOPMENT / SANITY_STUDIO_DATASET_PRODUCTION like in studio/.env.example",
	);
}

export const client = createClient({
	projectId,
	dataset,
	apiVersion: "2024-01-01",
	useCdn: false,
});
