const SANITY_API_VERSION = "v2021-06-07";

/**
 * When `true`, resolution tries the **development** dataset before **production**
 * (Management API or fallback order).
 * When `false`, **production** is tried first.
 *
 * **Production deployments** (Vercel production, Netlify production context, or
 * `SANITY_STUDIO_DEPLOYMENT_TARGET=production`) prefer the production dataset.
 * **Everything else** — local `next dev` / `next start`, Sanity `sanity dev`, preview
 * deploys — prefers development when it exists.
 *
 * `NODE_ENV` is intentionally not used: local `next start` runs with `NODE_ENV=production`
 * but should still prefer `development` if present.
 */
function preferDevelopmentDatasetFirst(env: NodeJS.ProcessEnv): boolean {
  const target = env.SANITY_STUDIO_DEPLOYMENT_TARGET?.trim().toLowerCase();
  if (target === "production") {
    return false;
  }
  if (target === "development" || target === "preview") {
    return true;
  }

  // Vercel: only the production deployment uses the production dataset first.
  if (env.VERCEL === "1" && env.VERCEL_ENV === "production") {
    return false;
  }

  // Netlify: `CONTEXT=production` is the live site; previews/branches behave like dev-first.
  if (env.NETLIFY === "true" && env.CONTEXT === "production") {
    return false;
  }

  // Local and preview-style deploys: development dataset first when it exists.
  return true;
}

export type ResolveStudioDatasetOptions = {
  /** When true, skip Management API (use preference order only). */
  skipApi?: boolean;
};

/**
 * Explicit `SANITY_STUDIO_DATASET` always wins.
 * Otherwise: **production deployments** (e.g. Vercel `VERCEL_ENV=production`, Netlify
 * `CONTEXT=production`) prefer the production dataset; **local and preview** contexts
 * prefer the development dataset when it exists (see `preferDevelopmentDatasetFirst` above).
 * Optional Management API call (token) picks the first preferred name that exists on the project.
 * Without API: uses the first preferred name (may not exist yet — create it or set SANITY_STUDIO_DATASET).
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

  if (!options.skipApi && projectId && token) {
    const names = await fetchProjectDatasetNames(projectId, token);
    if (names?.length) {
      const set = new Set(names);
      for (const name of preferred) {
        if (set.has(name)) {
          return name;
        }
      }
      const fallbackName = names[0];
      if (preferDevFirst) {
        console.warn(
          `[sanity] None of the preferred datasets (${preferred.join(", ")}) exist on this project. Using "${fallbackName}". Create "${preferred[0]}" or set SANITY_STUDIO_DATASET.`,
        );
      }
      if (fallbackName !== undefined) {
        return fallbackName;
      }
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
      `https://api.sanity.io/${SANITY_API_VERSION}/projects/${projectId}/datasets`,
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
