import {
	type ResolveStudioDatasetOptions,
	resolveStudioDatasetAsync,
} from "@repo/sanity-dataset-resolve";

/**
 * Dataset resolution lives in **`@repo/sanity-dataset-resolve`** (shared with Studio).
 * This file re-exports it for the web app and adds **`getSanityStudioProjectId`** only.
 */
export type { ResolveStudioDatasetOptions };
export { resolveStudioDatasetAsync };

export function getSanityStudioProjectId(
	env: NodeJS.ProcessEnv = process.env,
): string {
	return (
		env.SANITY_STUDIO_PROJECT_ID?.trim() ||
		env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ||
		""
	);
}
