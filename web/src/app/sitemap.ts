import type { MetadataRoute } from "next";
import { cachedSitemapPages } from "@/sanity/cachedSanityQuery";
import { fetchSiteLanguageSettings } from "@/sanity/fetchSanityData";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

const BASE_URL = (
	process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
).replace(/\/$/, "");

/**
 * Refresh on tag invalidation (`pages`, `home`, `site-language-settings`, `site-pages`)
 * via `/api/revalidate`. The 1 h fail-safe revalidate ensures editors who skip the
 * webhook still get fresh sitemaps within reasonable time.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [pages, siteLocale] = await Promise.all([
		cachedSitemapPages(),
		fetchSiteLanguageSettings({ stega: false }),
	]);
	const pathUtils = createLanguagePathUtils(siteLocale);

	const entries: MetadataRoute.Sitemap = [];

	for (const page of pages) {
		for (const locale of siteLocale.localeIds) {
			const pathname = pathUtils.localePath(page.path, locale);
			const url = `${BASE_URL}${pathname === "/" ? "" : pathname}` || BASE_URL;

			const languages: Record<string, string> = {};
			for (const altLocale of siteLocale.localeIds) {
				const altPath = pathUtils.localePath(page.path, altLocale);
				languages[altLocale] =
					`${BASE_URL}${altPath === "/" ? "" : altPath}` || BASE_URL;
			}
			const xDefaultPath = pathUtils.localePath(
				page.path,
				siteLocale.defaultLocale,
			);
			languages["x-default"] =
				`${BASE_URL}${xDefaultPath === "/" ? "" : xDefaultPath}` || BASE_URL;

			entries.push({
				url,
				lastModified: page._updatedAt,
				changeFrequency: page._type === "home" ? "daily" : "weekly",
				priority: page._type === "home" ? 1.0 : 0.8,
				alternates: { languages },
			});
		}
	}

	return entries;
}
