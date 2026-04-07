export function getStudioEnv() {
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
  const dataset = process.env.SANITY_STUDIO_DATASET ?? "production";
  return { projectId, dataset };
}
