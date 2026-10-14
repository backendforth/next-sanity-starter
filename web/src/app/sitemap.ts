import type { MetadataRoute } from "next";
import { cachedSitemapPages } from "@/sanity/cachedSanityQuery";
import { fetchSiteLanguageSettings } from "@/sanity/fetchSanityData";
import { hreflangLanguages } from "@/sanity/seo/resolveSanityMetadata";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { SITE_BASE_URL } from "@/src/utils/siteUrl";

/**
 * Refresh on tag invalidation (`pages`, `site-pages`, `site-language-settings`)
 * via `/api/revalidate`. The 1 h fail-safe revalidate ensures editors who skip
 * the webhook still get fresh sitemaps within reasonable time.
 */
export const revalidate = 3600;

/**
 * One sitemap entry per language variant of a routable document. With
 * document-level translation each language is its own document and slugs may
 * differ, so the `hreflang` alternates come from the row's `translations`
 * (linked via `translation.metadata`), not from the row's own path.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [pages, siteLocale] = await Promise.all([
		cachedSitemapPages(),
		fetchSiteLanguageSettings({ stega: false }),
	]);
	const pathUtils = createLanguagePathUtils(siteLocale);

	const entries: MetadataRoute.Sitemap = [];

	for (const page of pages) {
		const language =
			typeof page.language === "string" && page.language.trim()
				? page.language.trim()
				: siteLocale.defaultLocale;
		const pathname = pathUtils.localePath(page.path, language);
		const url =
			`${SITE_BASE_URL}${pathname === "/" ? "" : pathname}` || SITE_BASE_URL;

		entries.push({
			url,
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
