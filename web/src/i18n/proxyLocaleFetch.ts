import { resolveStudioDatasetAsync } from "@repo/sanity-dataset-resolve";

import { normalizeSiteLocaleConfig } from "@/sanity/normalizeSiteLocaleConfig";
import { siteLanguageSettingsQuery } from "@/sanity/queries";
import { getSanityStudioProjectId } from "@/sanity/resolveStudioDataset";
import type { SiteLanguageSettingsDocument } from "@/sanity/types/siteLanguageSettings";

import type { SiteLocaleConfig } from "./fallbackSiteLocales";

const TTL_MS = 60_000;

type CacheEntry = { config: SiteLocaleConfig; expires: number };

let cache: CacheEntry | null = null;

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
 * Edge/middleware path for `siteLanguageSettings` — manual `fetch()` + 60s in-memory cache.
 *
 * Render paths use `fetchSiteLanguageSettings` in `web/sanity/fetchSanityData.ts`, which
 * delegates to `cachedSiteLanguageSettingsPublished` (`unstable_cache`, tag
 * `site-language-settings`) when no read token is set, or a drafts `client.fetch` when
 * `SANITY_API_READ_TOKEN` is present. Keep those two paths; only the GROQ string is shared
 * via `siteLanguageSettingsQuery` from `web/sanity/queries`.
 *
 * CDN when no token; API + drafts perspective when `SANITY_API_READ_TOKEN` is set.
 * Dataset resolution matches `web/sanity/sanityEnv.ts` when env is not pinned.
 */
export async function fetchSiteLocaleConfigForProxy(): Promise<SiteLocaleConfig> {
	const now = Date.now();
	if (cache && now < cache.expires) {
		return cache.config;
	}

	const projectId = getSanityStudioProjectId();
	if (!projectId) {
		const config = normalizeSiteLocaleConfig(null);
		cache = { config, expires: now + TTL_MS };
		return config;
	}

	let dataset: string;
	try {
		dataset = await resolveDatasetName();
	} catch (err) {
		console.error("[proxyLocaleFetch] dataset resolution failed", err);
		const config = normalizeSiteLocaleConfig(null);
		cache = { config, expires: now + TTL_MS };
		return config;
	}

	const query = siteLanguageSettingsQuery;
	const token = process.env.SANITY_API_READ_TOKEN?.trim();

	let config = normalizeSiteLocaleConfig(null);
	try {
		if (token) {
			const url = new URL(
				`https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}`,
			);
			url.searchParams.set("query", query);
			url.searchParams.set("perspective", "drafts");
			const res = await fetch(url.toString(), {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const json: unknown = await res.json();
				const result =
					json &&
					typeof json === "object" &&
					"result" in json &&
					(json as { result: unknown }).result;
				config = normalizeSiteLocaleConfig(
					result as SiteLanguageSettingsDocument | null,
				);
			}
		} else {
			const url = `https://${projectId}.apicdn.sanity.io/v2024-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`;
			const res = await fetch(url);
			if (res.ok) {
				const json: unknown = await res.json();
				const result =
					json &&
					typeof json === "object" &&
					"result" in json &&
					(json as { result: unknown }).result;
				config = normalizeSiteLocaleConfig(
					result as SiteLanguageSettingsDocument | null,
				);
			}
		}
	} catch (err) {
		console.error("[proxyLocaleFetch] fetch or parse failed", err);
	}

	cache = { config, expires: now + TTL_MS };
	return config;
}
