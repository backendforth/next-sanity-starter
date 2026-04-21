/**
 * Single source of truth for Sanity-backed `unstable_cache` time windows and matching
 * `export const revalidate` on static routes.
 *
 * Kept in a tiny module so route files can import it without pulling in `cachedSanityQuery`
 * (Next 16 rejects some segment-config bindings that re-export through heavier modules).
 */
export const SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS = 60 as const;

/** Literal type for route `revalidate` (must match the const above). */
export type SanityDocumentCacheRevalidateSeconds =
	typeof SANITY_DOCUMENT_CACHE_REVALIDATE_SECONDS;
