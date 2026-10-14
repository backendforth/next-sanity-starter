import type { MetadataRoute } from "next";
import { cachedSitemapPages } from "@/sanity/cachedSanityQuery";
import { fetchSiteLanguageSettings } from "@/sanity/fetchSanityData";
import { hreflangLanguages } from "@/sanity/seo/resolveSanityMetadata";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { absoluteSiteUrl } from "@/src/utils/siteUrl";

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
