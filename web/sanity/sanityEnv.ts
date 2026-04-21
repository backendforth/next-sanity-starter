import {
	getSanityStudioProjectId,
	resolveStudioDatasetAsync,
} from "./resolveStudioDataset";

export const projectId = getSanityStudioProjectId();
export const dataset = await resolveStudioDatasetAsync(process.env);

/**
 * True when the resolved dataset name matches the configured development dataset name
 * (after async resolution; see `resolveStudioDataset.ts` for how that name is chosen).
 */
export function isSanityStudioDevContext(
	env: NodeJS.ProcessEnv = process.env,
): boolean {
	const devName =
		env.SANITY_STUDIO_DATASET_DEVELOPMENT?.trim() ?? "development";
	return dataset === devName;
}
