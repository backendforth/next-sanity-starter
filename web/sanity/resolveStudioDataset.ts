/**
 * Synchrone Dataset-Auswahl — gleiche Regeln wie `studio/config/resolveStudioDataset.ts`,
 * wenn kein Management-API-Call läuft: explizites Dataset gewinnt, sonst `NODE_ENV`.
 *
 * Das Studio kann zusätzlich per API das erste *existierende* bevorzugte Dataset wählen; das Web
 * repliziert das nicht (kein Token nötig). Bei Abweichungen `SANITY_STUDIO_DATASET` setzen.
 */
export function getResolvedStudioDataset(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const explicit =
    env.SANITY_STUDIO_DATASET?.trim() ||
    env.NEXT_PUBLIC_SANITY_DATASET?.trim();
  if (explicit) {
    return explicit;
  }

  const devName =
    env.SANITY_STUDIO_DATASET_DEVELOPMENT?.trim() ?? "development";
  const prodName =
    env.SANITY_STUDIO_DATASET_PRODUCTION?.trim() ?? "production";
  const isDev = env.NODE_ENV === "development";
  return isDev ? devName : prodName;
}

export function getSanityStudioProjectId(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return (
    env.SANITY_STUDIO_PROJECT_ID?.trim() ||
    env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ||
    ""
  );
}

/**
 * `true`, wenn das aufgelöste Dataset dem konfigurierten Development-Namen entspricht
 * (z. B. `development` bei `next dev` ohne `SANITY_STUDIO_DATASET`, oder explizit gesetzt).
 */
export function isSanityStudioDevContext(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const resolved = getResolvedStudioDataset(env);
  const devName =
    env.SANITY_STUDIO_DATASET_DEVELOPMENT?.trim() ?? "development";
  return resolved === devName;
}
