import { resolveStudioDatasetAsync } from "@repo/sanity-dataset-resolve";

import { normalizeSiteLocaleConfig } from "@/sanity/normalizeSiteLocaleConfig";
import { siteLanguageSettingsQuery } from "@/sanity/queries";
import { getSanityStudioProjectId } from "@/sanity/resolveStudioDataset";
import type { SiteLanguageSettingsDocument } from "@/sanity/types/siteLanguageSettings";

import type { SiteLocaleConfig } from "./fallbackSiteLocales";

const TTL_MS = 60_000;

type CacheEntry = { config: SiteLocaleConfig; expires: number };

let cache: CacheEntry | null = null;
let refreshInFlight: Promise<SiteLocaleConfig> | null = null;

async function resolveDatasetName(): Promise<string> {
	const explicit =
		process.env.SANITY_STUDIO_DATASET?.trim() ||
		process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
	if (explicit) {
		return explicit;
	}
	return resolveStudioDatasetAsync(process.env);
}

/**
 * One GROQ round trip for `siteLanguageSettings`. Published reads go through the
 * CDN host (edge-cached, no auth); draft reads hit the live API with the read
 * token and `perspective=drafts`. Returns `null` on a non-OK response so callers
 * can keep serving a previous config instead of silently downgrading to the
 * offline fallback.
 */
async function querySiteLanguageSettings(
	projectId: string,
	dataset: string,
	drafts: boolean,
): Promise<SiteLocaleConfig | null> {
	const token = process.env.SANITY_API_READ_TOKEN?.trim();
	const host = drafts ? "api" : "apicdn";
	const url = new URL(
		`https://${projectId}.${host}.sanity.io/v2024-01-01/data/query/${dataset}`,
	);
	url.searchParams.set("query", siteLanguageSettingsQuery);
	if (drafts) {
		url.searchParams.set("perspective", "drafts");
	}
	const res = await fetch(url.toString(), {
		headers: drafts && token ? { Authorization: `Bearer ${token}` } : undefined,
	});
	if (!res.ok) return null;
	const json: unknown = await res.json();
	const result =
		json && typeof json === "object" && "result" in json
			? (json as { result: unknown }).result
			: null;
	return normalizeSiteLocaleConfig(
		result as SiteLanguageSettingsDocument | null,
	);
}

/**
 * Refresh the published config once, no matter how many requests hit an expired
 * cache simultaneously (single-flight). Failures keep the previous config and
 * still bump `expires`, so a Sanity hiccup never turns into a refetch storm.
 */
function refreshPublishedConfig(): Promise<SiteLocaleConfig> {
	if (refreshInFlight) return refreshInFlight;
	refreshInFlight = (async () => {
		const previous = cache?.config ?? null;
		let config = previous ?? normalizeSiteLocaleConfig(null);
		try {
			const projectId = getSanityStudioProjectId();
			if (projectId) {
				const dataset = await resolveDatasetName();
				const fresh = await querySiteLanguageSettings(
					projectId,
					dataset,
					false,
				);
				if (fresh) config = fresh;
			}
		} catch (err) {
			console.error("[proxyLocaleFetch] fetch or parse failed", err);
		}
		cache = { config, expires: Date.now() + TTL_MS };
		return config;
	})().finally(() => {
		refreshInFlight = null;
	});
	return refreshInFlight;
}

/**
 * Proxy/middleware path for `siteLanguageSettings` — manual `fetch()` + 60s
 * in-memory cache with stale-while-revalidate. This runs on **every** page
 * request, so it must never add a blocking Sanity round trip to routine
 * traffic:
 *
 * - **Published (default).** CDN host, anonymous, cached in memory. An expired
 *   entry is served stale while a single background refresh runs — only the
 *   very first request of a process/isolate ever waits for Sanity.
 * - **Drafts (`preferDrafts: true`).** For requests that are actually in Draft
 *   Mode (Presentation preview) and in dev: live API + read token +
 *   `perspective=drafts`, fetched per request and never written to the shared
 *   cache. Falls back to the published path when the fetch fails.
 *
 * Render paths use `fetchSiteLanguageSettings` in `web/sanity/fetchSanityData.ts`,
 * which applies the same published-unless-draft rule via `unstable_cache` (tag
 * `site-language-settings`). Keep those two paths; only the GROQ string is
 * shared via `siteLanguageSettingsQuery` from `web/sanity/queries`.
 *
 * Dataset resolution matches `web/sanity/sanityEnv.ts` when env is not pinned.
 */
export async function fetchSiteLocaleConfigForProxy(options?: {
	preferDrafts?: boolean;
}): Promise<SiteLocaleConfig> {
	const projectId = getSanityStudioProjectId();
	if (!projectId) {
		return normalizeSiteLocaleConfig(null);
	}

	if (options?.preferDrafts && process.env.SANITY_API_READ_TOKEN?.trim()) {
		try {
			const dataset = await resolveDatasetName();
			const config = await querySiteLanguageSettings(projectId, dataset, true);
			if (config) return config;
		} catch (err) {
			console.error("[proxyLocaleFetch] drafts fetch failed", err);
		}
		// fall through to the published/cached path
	}

	const now = Date.now();
	if (cache && now < cache.expires) {
		return cache.config;
	}
	if (cache) {
		void refreshPublishedConfig();
		return cache.config;
	}
	return refreshPublishedConfig();
}
