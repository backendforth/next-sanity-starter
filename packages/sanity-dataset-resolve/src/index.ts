/**
 * Canonical Sanity dataset resolution for Studio and Web (`resolveStudioDatasetAsync`):
 *
 * 1. `SANITY_STUDIO_DATASET` always wins.
 * 2. Otherwise the first name from {@link preference} that exists in the project, probed on the
 *    public Data API (no token needed).
 * 3. If none exists, or existence can't be checked (no project id, offline), the first
 *    preferred name — never a silent switch to production.
 *
 * Every caller resolves once per process: `web/next.config.ts` per build or server start, the
 * Studio when `studioDataset.ts` loads (CLI or browser). Nothing is cached here.
 *
 * `NODE_ENV` is not used: a local `next start` runs with `NODE_ENV=production` but should still
 * prefer `development`.
 */

const DATA_API_VERSION = "v2024-01-01";

/** Minimal env shape for resolution (Studio and Next pass compatible objects). */
export type SanityDatasetResolveEnv = {
	SANITY_STUDIO_DATASET?: string | undefined;
	SANITY_STUDIO_PROJECT_ID?: string | undefined;
	SANITY_STUDIO_DATASET_DEVELOPMENT?: string | undefined;
	SANITY_STUDIO_DATASET_PRODUCTION?: string | undefined;
	SANITY_STUDIO_DEPLOYMENT_TARGET?: string | undefined;
	/** Host build context: only Node callers see these, never the Studio's browser bundle. */
	VERCEL?: string | undefined;
	VERCEL_ENV?: string | undefined;
	NETLIFY?: string | undefined;
	CONTEXT?: string | undefined;
};

/**
 * `process.env` (Node / Next) or a literal map (`studioResolveEnv()`). Union avoids
 * TypeScript treating `ProcessEnv` and `SanityDatasetResolveEnv` as unrelated.
 */
export type SanityDatasetResolveInput =
	| SanityDatasetResolveEnv
	| NodeJS.ProcessEnv;

/** The host's own production context (Vercel, Netlify), never set in the Studio's browser bundle. */
function isProductionHost(env: SanityDatasetResolveInput): boolean {
	return (
		(env.VERCEL === "1" && env.VERCEL_ENV === "production") ||
		(env.NETLIFY === "true" && env.CONTEXT === "production")
	);
}

/**
 * Whether this deploy is the production site: an explicit `SANITY_STUDIO_DEPLOYMENT_TARGET`
 * decides (`production` or not, any case), otherwise the host's production context. A staging
 * site on a production host context sets the target to stay non-production. The web's crawl
 * switch (`robots.ts`) follows it, and so does its canonical origin (`siteUrl.ts`) except on
 * Netlify's production context, which serves the primary domain either way.
 */
export function isProductionDeployment(
	env: SanityDatasetResolveInput,
): boolean {
	const target = env.SANITY_STUDIO_DEPLOYMENT_TARGET?.trim().toLowerCase();
	return target ? target === "production" : isProductionHost(env);
}

/**
 * Dataset names to try, in order: development and production (renamable via env; an empty
 * override counts as unset), production first on a production deploy. A custom
 * `SANITY_STUDIO_DEPLOYMENT_TARGET` (e.g. `staging`) is tried before both.
 */
function preference(env: SanityDatasetResolveInput): string[] {
	const development =
		env.SANITY_STUDIO_DATASET_DEVELOPMENT?.trim() || "development";
	const production =
		env.SANITY_STUDIO_DATASET_PRODUCTION?.trim() || "production";
	const target = env.SANITY_STUDIO_DEPLOYMENT_TARGET?.trim() || undefined;
	const named = target?.toLowerCase();

	const productionFirst =
		named === "production" ||
		(named !== "development" && named !== "preview" && isProductionHost(env));
	const pair = productionFirst
		? [production, development]
		: [development, production];
	const custom =
		target && !["production", "development", "preview"].includes(named ?? "")
			? target
			: undefined;
	return custom ? [custom, ...pair.filter((name) => name !== custom)] : pair;
}

/**
 * Whether `dataset` exists, probed on the Data API: 404 means missing, 401/403 that it exists but
 * is private. `null` when the probe itself failed (offline, API error).
 */
async function datasetExists(
	projectId: string,
	dataset: string,
): Promise<boolean | null> {
	const query = encodeURIComponent('*[_id == "sanity.imageAsset"][0]');
	try {
		const res = await fetch(
			`https://${projectId}.api.sanity.io/${DATA_API_VERSION}/data/query/${dataset}?query=${query}`,
		);
		if (res.status === 404) return false;
		if (res.ok || res.status === 401 || res.status === 403) return true;
		return null;
	} catch {
		return null;
	}
}

/**
 * The dataset to use: explicit env, else the first preferred one that exists, else the first
 * preferred one (with a warning when another exists instead).
 */
export async function resolveStudioDatasetAsync(
	env: SanityDatasetResolveInput,
): Promise<string> {
	const explicit = env.SANITY_STUDIO_DATASET?.trim();
	if (explicit) return explicit;

	const preferred = preference(env);
	const first = preferred[0] ?? "development";
	const projectId = env.SANITY_STUDIO_PROJECT_ID?.trim();
	if (!projectId) return first;

	for (const name of preferred) {
		const exists = await datasetExists(projectId, name);
		/* Can't tell: stay on the first choice rather than guess another dataset. */
		if (exists === null) return first;
		if (exists) {
			if (name !== first) {
				console.warn(
					`[sanity] Dataset "${first}" does not exist in project ${projectId}; using "${name}". Create "${first}" or set SANITY_STUDIO_DATASET.`,
				);
			}
			return name;
		}
	}
	console.warn(
		`[sanity] None of ${preferred.map((name) => `"${name}"`).join(", ")} exists in project ${projectId}; using "${first}". Create it or set SANITY_STUDIO_DATASET.`,
	);
	return first;
}
