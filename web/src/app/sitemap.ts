import type { MetadataRoute } from "next";
import { cachedSitemapPages } from "@/sanity/cachedSanityQuery";
import { fetchSiteLanguageSettings } from "@/sanity/fetchSanityData";
import { hreflangLanguages } from "@/sanity/seo/resolveSanityMetadata";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { absoluteSiteUrl } from "@/src/utils/siteUrl";

/**
 * Refresh on tag invalidation (`pages`, `home`, `site-language-settings`, `site-pages`)
 * via `/api/revalidate`. The 1 h fail-safe revalidate ensures editors who skip the
 * webhook still get fresh sitemaps within reasonable time.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [pages, siteLocale] = await Promise.all([
		cachedSitemapPages(),
		fetchSiteLanguageSettings(),
	]);
	const { localePath } = createLanguagePathUtils(siteLocale);

	return pages.flatMap((page) => {
		const languages = hreflangLanguages(page.path, siteLocale);
		return siteLocale.localeIds.map((locale) => ({
			url: absoluteSiteUrl(localePath(page.path, locale)),
			lastModified: page._updatedAt,
			changeFrequency: page._type === "home" ? "daily" : "weekly",
			priority: page._type === "home" ? 1.0 : 0.8,
			alternates: { languages },
		}));
	});
}
