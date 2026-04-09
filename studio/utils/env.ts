import { studioDataset } from "../config/studioDataset";

export function getStudioEnv() {
	const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
	return { projectId, dataset: studioDataset };
}
