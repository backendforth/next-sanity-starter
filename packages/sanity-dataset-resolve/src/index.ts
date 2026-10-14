/**
 * Canonical Sanity dataset resolution for Studio and Web (`resolveStudioDatasetAsync`):
 *
 * 1. `SANITY_STUDIO_DATASET`, or (web) `NEXT_PUBLIC_SANITY_DATASET`, always wins.
 * 2. Otherwise the first name from {@link preference} that exists in the project: listed by the
 *    Management API when a token is set, else probed on the Data API. Checks are memoized.
 * 3. If none exists, or existence can't be checked (no project id, offline), the first
 *    preferred name — never a silent switch to production.
 *
 * `NODE_ENV` is not used: a local `next start` runs with `NODE_ENV=production` but should still
 * prefer `development`.
 */

const DATA_API_VERSION = "v2024-01-01";
const MANAGEMENT_API_VERSION = "v2021-06-07";

/** Minimal env shape for resolution (Studio and Next pass compatible objects). */
export type SanityDatasetResolveEnv = {
	SANITY_STUDIO_DATASET?: string | undefined;
	/** Web: inlined at build when prefixed with `NEXT_PUBLIC_`. */
	NEXT_PUBLIC_SANITY_DATASET?: string | undefined;
	SANITY_STUDIO_PROJECT_ID?: string | undefined;
	SANITY_STUDIO_DATASET_DEVELOPMENT?: string | undefined;
	SANITY_STUDIO_DATASET_PRODUCTION?: string | undefined;
	SANITY_STUDIO_DEPLOYMENT_TARGET?: string | undefined;
	/**
	 * Management API token for listing datasets. Deliberately not `SANITY_STUDIO_*`: the
	 * Studio build inlines every variable with that prefix into its public bundle.
	 */
	SANITY_DATASET_RESOLVER_TOKEN?: string | undefined;
	SANITY_AUTH_TOKEN?: string | undefined;
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
	const isProductionHost =
		(env.VERCEL === "1" && env.VERCEL_ENV === "production") ||
		(env.NETLIFY === "true" && env.CONTEXT === "production");

	const productionFirst =
		named === "production" ||
		(named !== "development" && named !== "preview" && isProductionHost);
	const pair = productionFirst
		? [production, development]
		: [development, production];
	const custom =
		target && !["production", "development", "preview"].includes(named ?? "")
			? target
			: undefined;
	return custom ? [custom, ...pair.filter((name) => name !== custom)] : pair;
}

/** `true` / `false` when known, `null` when the check itself failed (offline, API error). */
type Existence = boolean | null;

/* Memoized per process (the web proxy re-resolves on every locale-config refresh). Failed
 * checks are dropped from the cache, so a later call tries again. */
const datasetLists = new Map<string, Promise<Set<string> | null>>();
const probes = new Map<string, Promise<Existence>>();

/** Every dataset of the project, via the Management API (needs a token). */
function listDatasets(projectId: string, token: string) {
	let list = datasetLists.get(projectId);
	if (!list) {
		list = fetch(
			`https://api.sanity.io/${MANAGEMENT_API_VERSION}/projects/${projectId}/datasets`,
			{ headers: { Authorization: `Bearer ${token}` } },
		)
			.then(async (res) => {
				if (!res.ok) return null;
				const data: unknown = await res.json();
				if (!Array.isArray(data)) return null;
				const names = data.map((item: unknown) =>
					typeof item === "string" ? item : (item as { name?: unknown }).name,
				);
				return new Set(names.filter((n): n is string => typeof n === "string"));
			})
			.catch(() => null)
			.then((names) => {
				if (!names) datasetLists.delete(projectId);
				return names;
			});
		datasetLists.set(projectId, list);
	}
	return list;
}

/** One dataset, probed on the Data API: 404 means missing; 401/403 means it exists but is private. */
function probeDataset(projectId: string, dataset: string): Promise<Existence> {
	const key = `${projectId}/${dataset}`;
	let probe = probes.get(key);
	if (!probe) {
		const query = encodeURIComponent('*[_id == "sanity.imageAsset"][0]');
		probe = fetch(
			`https://${projectId}.api.sanity.io/${DATA_API_VERSION}/data/query/${dataset}?query=${query}`,
		)
			.then((res): Existence => {
				if (res.status === 404) return false;
				if (res.ok || res.status === 401 || res.status === 403) return true;
				return null;
			})
			.catch((): Existence => null)
			.then((exists) => {
				if (exists === null) probes.delete(key);
				return exists;
			});
		probes.set(key, probe);
	}
	return probe;
}

async function datasetExists(
	projectId: string,
	dataset: string,
	token: string | undefined,
): Promise<Existence> {
	const list = token ? await listDatasets(projectId, token) : null;
	return list ? list.has(dataset) : probeDataset(projectId, dataset);
}

/**
 * The dataset to use: explicit env, else the first preferred one that exists, else the first
 * preferred one (with a warning when another exists instead).
 */
export async function resolveStudioDatasetAsync(
	env: SanityDatasetResolveInput,
): Promise<string> {
	const explicit =
		env.SANITY_STUDIO_DATASET?.trim() || env.NEXT_PUBLIC_SANITY_DATASET?.trim();
	if (explicit) return explicit;

	const preferred = preference(env);
	const first = preferred[0] ?? "development";
	const projectId = env.SANITY_STUDIO_PROJECT_ID?.trim();
	if (!projectId) return first;

	const token =
		env.SANITY_DATASET_RESOLVER_TOKEN?.trim() ||
		env.SANITY_AUTH_TOKEN?.trim() ||
		undefined;
	for (const name of preferred) {
		const exists = await datasetExists(projectId, name, token);
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
