import { createClient } from "next-sanity";

import { dataset, projectId } from "./sanityEnv";

if (!projectId || !dataset) {
	throw new Error(
		"Missing SANITY_STUDIO_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID) and/or could not resolve dataset — set SANITY_STUDIO_DATASET or SANITY_STUDIO_DATASET_DEVELOPMENT / SANITY_STUDIO_DATASET_PRODUCTION like in studio/.env.example",
	);
}

/** Edge-cached API reads in production; set `SANITY_USE_CDN=false` for always-fresh data (e.g. debugging). */
function sanityUseCdn(): boolean {
	if (process.env.SANITY_USE_CDN === "false") {
		return false;
	}
	if (process.env.SANITY_USE_CDN === "true") {
		return true;
	}
	return process.env.NODE_ENV === "production";
}

export const client = createClient({
	projectId,
	dataset,
	apiVersion: "2024-01-01",
	useCdn: sanityUseCdn(),
});
