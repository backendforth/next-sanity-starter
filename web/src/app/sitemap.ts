import type { MetadataRoute } from "next";
import { cachedSitemapPages } from "@/sanity/cachedSanityQuery";
import { fetchSiteLanguageSettings } from "@/sanity/fetchSanityData";
import { hreflangLanguages } from "@/sanity/seo/resolveSanityMetadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [pages, siteLocale] = await Promise.all([
		cachedSitemapPages(),
		fetchSiteLanguageSettings(),
	]);

	return pages.flatMap((page) => {
		const languages = hreflangLanguages(page.path, siteLocale);
		return siteLocale.localeIds.map((locale) => ({
			url: languages[locale],
			lastModified: page._updatedAt,
			changeFrequency: page._type === "home" ? "daily" : "weekly",
			priority: page._type === "home" ? 1.0 : 0.8,
			alternates: { languages },
		}));
	});
}
