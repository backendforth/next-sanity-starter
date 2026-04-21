/**
 * Canonical Sanity dataset resolution for Studio and Web.
 *
 * **Resolution order** (`resolveStudioDatasetAsync`):
 * 1. `SANITY_STUDIO_DATASET`, or (web) `NEXT_PUBLIC_SANITY_DATASET` — always wins.
 * 2. Otherwise: pick the first name from **`getPreferredDatasetNamesInOrder`** that exists
 *    (Management API when project id + token are set; else HTTP probe on the Data API).
 * 3. If neither canonical name exists but other datasets do, use the first from the API (with a warning when in dev-first context).
 * 4. Fallback to the first preferred name.
 *
 * `NODE_ENV` is not used: local `next start` runs with `NODE_ENV=production` but should still
 * prefer `development` when appropriate.
 */

/** Data API version for HTTP probes — URL segment includes `v`. */
const SANITY_DATA_API_VERSION = "2024-01-01";
const SANITY_HTTP_API_PATH = `v${SANITY_DATA_API_VERSION}`;
const MANAGEMENT_API_VERSION = "v2021-06-07";

/** Minimal env shape for resolution (Studio and Next pass compatible objects). */
export type SanityDatasetResolveEnv = {
	SANITY_STUDIO_DATASET?: string | undefined;
	/** Web: inlined at build when prefixed with `NEXT_PUBLIC_`. */
	NEXT_PUBLIC_SANITY_DATASET?: string | undefined;
	SANITY_STUDIO_PROJECT_ID?: string | undefined;
	NEXT_PUBLIC_SANITY_PROJECT_ID?: string | undefined;
	SANITY_STUDIO_DATASET_DEVELOPMENT?: string | undefined;
	SANITY_STUDIO_DATASET_PRODUCTION?: string | undefined;
	SANITY_STUDIO_DEPLOYMENT_TARGET?: string | undefined;
	SANITY_STUDIO_DATASET_RESOLVER_TOKEN?: string | undefined;
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
 * When deployment target is unset or custom: production-style hosts prefer **production**
 * first; everything else prefers **development** first.
 */
export function inferPreferDevelopmentFirstWhenTargetUnset(
	env: SanityDatasetResolveInput,
): boolean {
	if (env.VERCEL === "1" && env.VERCEL_ENV === "production") {
		return false;
	}
	if (env.NETLIFY === "true" && env.CONTEXT === "production") {
		return false;
	}
	return true;
}

/**
 * Whether warning copy should assume a “local / preview / dev-first” context
 * (vs production-first).
 */
function warnPreferDevContext(env: SanityDatasetResolveInput): boolean {
	const t = env.SANITY_STUDIO_DEPLOYMENT_TARGET?.trim().toLowerCase();
	if (t === "production") {
		return false;
	}
	if (t === "development" || t === "preview") {
		return true;
	}
	return inferPreferDevelopmentFirstWhenTargetUnset(env);
}

/**
 * Dataset names to try in order: mutual fallbacks between canonical dev/prod (or renamed via env),
 * with deployment-based preference. Optional custom `SANITY_STUDIO_DEPLOYMENT_TARGET` (e.g. `staging`)
 * is tried first, then the same dev/prod permutation as when target is unset.
 */
export function getPreferredDatasetNamesInOrder(
	env: SanityDatasetResolveInput,
): string[] {
	const devName =
		env.SANITY_STUDIO_DATASET_DEVELOPMENT?.trim() ?? "development";
	const prodName = env.SANITY_STUDIO_DATASET_PRODUCTION?.trim() ?? "production";

	const raw = env.SANITY_STUDIO_DEPLOYMENT_TARGET?.trim();
	const targetLower = raw?.toLowerCase();

	let preferDevFirst: boolean;
	let customFirst: string | undefined;

	if (!raw) {
		preferDevFirst = inferPreferDevelopmentFirstWhenTargetUnset(env);
	} else if (targetLower === "production") {
		preferDevFirst = false;
	} else if (targetLower === "development" || targetLower === "preview") {
		preferDevFirst = true;
	} else {
		customFirst = raw;
		preferDevFirst = inferPreferDevelopmentFirstWhenTargetUnset(env);
	}

	const pair = preferDevFirst ? [devName, prodName] : [prodName, devName];

	if (customFirst) {
		const rest = pair.filter((n) => n !== customFirst);
		return [customFirst, ...rest];
	}
	return pair;
}

export type ResolveStudioDatasetOptions = {
	/** When true, skip Management API and HTTP probes (use preference order only). */
	skipProbe?: boolean;
};

/**
 * Explicit `SANITY_STUDIO_DATASET` / `NEXT_PUBLIC_SANITY_DATASET` always wins.
 * Otherwise: first preferred name that exists (Management API or HTTP probe).
 */
export async function resolveStudioDatasetAsync(
	env: SanityDatasetResolveInput,
	options: ResolveStudioDatasetOptions = {},
): Promise<string> {
	const explicit =
		env.SANITY_STUDIO_DATASET?.trim() || env.NEXT_PUBLIC_SANITY_DATASET?.trim();
	if (explicit) {
		return explicit;
	}

	const projectId =
		env.SANITY_STUDIO_PROJECT_ID?.trim() ||
		env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
	const devName =
		env.SANITY_STUDIO_DATASET_DEVELOPMENT?.trim() ?? "development";
	const prodName = env.SANITY_STUDIO_DATASET_PRODUCTION?.trim() ?? "production";
	const preferred = getPreferredDatasetNamesInOrder(env);
	const preferDevWarn = warnPreferDevContext(env);

	const token =
		env.SANITY_STUDIO_DATASET_RESOLVER_TOKEN?.trim() ||
		env.SANITY_AUTH_TOKEN?.trim();

	if (!options.skipProbe && projectId && token) {
		const names = await fetchProjectDatasetNames(projectId, token);
		if (names?.length) {
			const set = new Set(names);
			for (let i = 0; i < preferred.length; i++) {
				const name = preferred[i];
				if (set.has(name)) {
					if (
						preferDevWarn &&
						name === prodName &&
						preferred.slice(0, i).includes(devName) &&
						!set.has(devName)
					) {
						console.warn(
							`[sanity] No dataset "${devName}" in this project. Using "${name}". Create "${devName}" (e.g. \`sanity dataset create ${devName}\`) or set SANITY_STUDIO_DATASET / NEXT_PUBLIC_SANITY_DATASET.`,
						);
					}
					return name;
				}
			}
			const fallbackName = names[0];
			if (fallbackName !== undefined) {
				if (preferDevWarn) {
					console.warn(
						`[sanity] None of the preferred datasets (${preferred.join(", ")}) exist on this project. Using "${fallbackName}". Create "${preferred[0]}" or set SANITY_STUDIO_DATASET.`,
					);
				}
				return fallbackName;
			}
		}
	}

	if (!options.skipProbe && projectId) {
		for (let i = 0; i < preferred.length; i++) {
			const name = preferred[i];
			if (await probeDatasetExists(projectId, name)) {
				if (
					preferDevWarn &&
					name === prodName &&
					preferred.slice(0, i).includes(devName)
				) {
					console.warn(
						`[sanity] Dataset "${devName}" is missing or not reachable. Using "${name}". Create "${devName}" or set SANITY_STUDIO_DATASET / NEXT_PUBLIC_SANITY_DATASET.`,
					);
				}
				return name;
			}
		}
		if (preferDevWarn) {
			console.warn(
				`[sanity] "${devName}" is not available or could not be verified. Using "${prodName}". Set SANITY_STUDIO_DATASET / NEXT_PUBLIC_SANITY_DATASET to override.`,
			);
			return prodName;
		}
	}

	const primary = preferred[0];
	if (primary === undefined) {
		throw new Error(
			"[sanity] Internal error: could not determine dataset preference.",
		);
	}
	return primary;
}

async function fetchProjectDatasetNames(
	projectId: string,
	token: string,
): Promise<string[] | null> {
	try {
		const res = await fetch(
			`https://api.sanity.io/${MANAGEMENT_API_VERSION}/projects/${projectId}/datasets`,
			{
				headers: { Authorization: `Bearer ${token}` },
			},
		);
		if (!res.ok) {
			return null;
		}
		const data: unknown = await res.json();
		if (Array.isArray(data) && data.every((x) => typeof x === "string")) {
			return data as string[];
		}
		if (
			Array.isArray(data) &&
			data.length > 0 &&
			typeof data[0] === "object" &&
			data[0] !== null &&
			"name" in (data[0] as object)
		) {
			return (data as { name: string }[]).map((d) => d.name);
		}
		return null;
	} catch {
		return null;
	}
}

/** True if the dataset exists (Data API returns something other than 404). */
async function probeDatasetExists(
	projectId: string,
	dataset: string,
): Promise<boolean> {
	try {
		const query = encodeURIComponent('*[_id == "sanity.imageAsset"][0]');
		const url = `https://${projectId}.api.sanity.io/${SANITY_HTTP_API_PATH}/data/query/${dataset}?query=${query}`;
		const res = await fetch(url, { method: "GET" });
		if (res.status === 404) {
			return false;
		}
		if (res.status === 401 || res.status === 403) {
			return true;
		}
		return res.ok;
	} catch {
		return false;
	}
}
