import type { MetadataRoute } from "next";
import { cachedSitemapPages } from "@/sanity/cachedSanityQuery";
import { fetchSiteLanguageSettings } from "@/sanity/fetchSanityData";
import { hreflangLanguages } from "@/sanity/seo/resolveSanityMetadata";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { absoluteSiteUrl } from "@/src/utils/siteUrl";

/**
 * One sitemap entry per language variant of a routable document. With
 * document-level translation each language is its own document and slugs may
 * differ, so the `hreflang` alternates come from the row's `translations`
 * (linked via `translation.metadata`), not from the row's own path.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [pages, siteLocale] = await Promise.all([
		cachedSitemapPages(),
		fetchSiteLanguageSettings(),
	]);
	const pathUtils = createLanguagePathUtils(siteLocale);

	const entries: MetadataRoute.Sitemap = [];

	for (const page of pages) {
		const language = page.language?.trim();
		/* A document in a language the site doesn't serve has no route. */
		if (!language || !pathUtils.isAppLocale(language)) continue;
		entries.push({
			url: absoluteSiteUrl(pathUtils.localePath(page.path, language)),
			lastModified: page._updatedAt,
			changeFrequency: page._type === "home" ? "daily" : "weekly",
			priority: page._type === "home" ? 1.0 : 0.8,
			alternates: {
				languages: hreflangLanguages(
					{ language, path: page.path },
					page.translations,
					siteLocale,
				),
			},
		});
	}

	return entries;
}
