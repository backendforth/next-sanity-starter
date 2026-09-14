import type { MetadataRoute } from "next";
import { cachedSitemapPages } from "@/sanity/cachedSanityQuery";
import { fetchSiteLanguageSettings } from "@/sanity/fetchSanityData";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { SITE_BASE_URL } from "@/src/utils/siteUrl";

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
			const url =
				`${SITE_BASE_URL}${pathname === "/" ? "" : pathname}` || SITE_BASE_URL;

			const languages: Record<string, string> = {};
			for (const altLocale of siteLocale.localeIds) {
				const altPath = pathUtils.localePath(page.path, altLocale);
				languages[altLocale] =
					`${SITE_BASE_URL}${altPath === "/" ? "" : altPath}` || SITE_BASE_URL;
			}
			const xDefaultPath = pathUtils.localePath(
				page.path,
				siteLocale.defaultLocale,
			);
			languages["x-default"] =
				`${SITE_BASE_URL}${xDefaultPath === "/" ? "" : xDefaultPath}` ||
				SITE_BASE_URL;

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
