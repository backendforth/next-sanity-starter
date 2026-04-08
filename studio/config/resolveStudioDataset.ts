const SANITY_API_VERSION = "v2021-06-07";

export type ResolveStudioDatasetOptions = {
  /** When true, skip Management API (use preference order only). */
  skipApi?: boolean;
};

/**
 * Explicit `SANITY_STUDIO_DATASET` always wins.
 * Otherwise: dev build prefers development dataset, production build prefers production dataset.
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
  const isDev = env.NODE_ENV === "development";
  const preferred = isDev ? [devName, prodName] : [prodName, devName];

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
      if (env.NODE_ENV === "development") {
        console.warn(
          `[sanity] Keines der bevorzugten Datasets (${preferred.join(", ")}) existiert im Projekt. Verwende "${fallbackName}". Lege "${preferred[0]}" an oder setze SANITY_STUDIO_DATASET.`,
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
      "[sanity] Interner Fehler: keine Dataset-Präferenz ermittelbar.",
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
