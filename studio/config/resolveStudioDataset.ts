/** Data API version for HTTP probes — URL segment includes `v`. */
const SANITY_DATA_API_VERSION = "2024-01-01";
const SANITY_HTTP_API_PATH = `v${SANITY_DATA_API_VERSION}`;
const MANAGEMENT_API_VERSION = "v2021-06-07";

/**
 * When `true`, resolution tries the **development** dataset before **production**
 * (Management API, HTTP probe, or fallback order).
 * When `false`, **production** is tried first.
 *
 * **Production deployments** (Vercel production, Netlify production context, or
 * `SANITY_STUDIO_DEPLOYMENT_TARGET=production`) prefer the production dataset.
 * **Everything else** — local Sanity `sanity dev`, preview deploys — prefers
 * **production** first (typical single-dataset projects). Prefer **development**
 * first only when `SANITY_STUDIO_DEPLOYMENT_TARGET` is `development` or `preview`.
 *
 * `NODE_ENV` is intentionally not used: local `next start` runs with `NODE_ENV=production`
 * but follows the same dataset preference as local dev (not tied to `NODE_ENV`).
 *
 * Logic matches `web/sanity/resolveStudioDataset.ts` (`preferDevelopmentDatasetFirst`).
 */
function preferDevelopmentDatasetFirst(env: NodeJS.ProcessEnv): boolean {
  const target = env.SANITY_STUDIO_DEPLOYMENT_TARGET?.trim().toLowerCase();
  if (target === "production") {
    return false;
  }
  if (target === "development" || target === "preview") {
    return true;
  }

  if (env.VERCEL === "1" && env.VERCEL_ENV === "production") {
    return false;
  }

  if (env.NETLIFY === "true" && env.CONTEXT === "production") {
    return false;
  }

  // Local / generic hosts: production first (many projects only create `production`).
  // Use SANITY_STUDIO_DEPLOYMENT_TARGET=development|preview to prefer `development` when you have both datasets.
  return false;
}

export type ResolveStudioDatasetOptions = {
  /** When true, skip Management API and HTTP probes (use preference order only). */
  skipProbe?: boolean;
};

/**
 * Explicit `SANITY_STUDIO_DATASET` always wins.
 * Otherwise: production deployments prefer **production**; local and generic hosts prefer
 * **production** first, then **development** (set `SANITY_STUDIO_DEPLOYMENT_TARGET=development`
 * or `preview` to prefer development when both exist). With Management API token: first preferred name that exists.
 * Without token: HTTP probe on the Data API — first preferred name that is not 404.
 */
export async function resolveStudioDatasetAsync(
  env: NodeJS.ProcessEnv,
  options: ResolveStudioDatasetOptions = {},
): Promise<string> {
  const explicit = env.SANITY_STUDIO_DATASET?.trim();
  if (explicit) {
    return explicit;
  }

  const projectId = env.SANITY_STUDIO_PROJECT_ID?.trim();
  const devName =
    env.SANITY_STUDIO_DATASET_DEVELOPMENT?.trim() ?? "development";
  const prodName = env.SANITY_STUDIO_DATASET_PRODUCTION?.trim() ?? "production";
  const preferDevFirst = preferDevelopmentDatasetFirst(env);
  const preferred = preferDevFirst ? [devName, prodName] : [prodName, devName];

  const token =
    env.SANITY_STUDIO_DATASET_RESOLVER_TOKEN?.trim() ||
    env.SANITY_AUTH_TOKEN?.trim();

  if (!options.skipProbe && projectId && token) {
    const names = await fetchProjectDatasetNames(projectId, token);
    if (names?.length) {
      const set = new Set(names);
      for (const name of preferred) {
        if (set.has(name)) {
          return name;
        }
      }
      const fallbackName = names[0];
      if (fallbackName !== undefined) {
        if (preferDevFirst) {
          console.warn(
            `[sanity] None of the preferred datasets (${preferred.join(", ")}) exist on this project. Using "${fallbackName}". Create "${preferred[0]}" or set SANITY_STUDIO_DATASET.`,
          );
        }
        return fallbackName;
      }
    }
  }

  if (!options.skipProbe && projectId) {
    for (const name of preferred) {
      if (await probeDatasetExists(projectId, name)) {
        return name;
      }
    }
    if (preferDevFirst) {
      console.warn(
        `[sanity] "${devName}" is not available or could not be verified. Using "${prodName}". Set SANITY_STUDIO_DATASET to override.`,
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
