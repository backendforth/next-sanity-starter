/**
 * Sanity settings for every web reader: GROQ client, proxy, Visual Editing attributes and image
 * URLs. `next.config.ts` resolves the dataset once per build and inlines project id and dataset
 * through its `env` map into server, proxy and client bundles, so they are plain literals
 * everywhere — server and client compute identical image URLs (no hydration mismatch) and images
 * come from the dataset the content was queried from. The read token is server-only:
 * `readToken.ts`.
 */
export const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim() || "";
export const dataset = process.env.SANITY_STUDIO_DATASET?.trim() || "";

/** Data API version of every query: the client and the proxy's raw HTTP read. */
export const apiVersion = "2024-01-01";

/** Published reads from the API CDN in production; `SANITY_USE_CDN=true|false` overrides that. */
export const useCdn =
	process.env.SANITY_USE_CDN === "true" ||
	(process.env.SANITY_USE_CDN !== "false" &&
		process.env.NODE_ENV === "production");

/** The Studio that stega click-to-edit links and `data-sanity` attributes open. */
export const studioUrl =
	process.env.NEXT_PUBLIC_SANITY_STUDIO_URL?.trim() || "http://localhost:3333";
