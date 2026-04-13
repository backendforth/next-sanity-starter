import {
	getSanityStudioProjectId,
	resolveStudioDatasetAsync,
} from "./resolveStudioDataset";

export const projectId = getSanityStudioProjectId();
export const dataset = await resolveStudioDatasetAsync(process.env);

/**
 * True when the resolved dataset name matches the configured development dataset
 * (after async resolution, including fallback to production when `development` is missing).
 */
export function isSanityStudioDevContext(
	env: NodeJS.ProcessEnv = process.env,
): boolean {
	const devName =
		env.SANITY_STUDIO_DATASET_DEVELOPMENT?.trim() ?? "development";
	return dataset === devName;
}
