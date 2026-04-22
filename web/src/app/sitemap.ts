import type { MetadataRoute } from "next";
import { client } from "@/sanity/client";
import { fetchSiteLanguageSettings } from "@/sanity/fetchSanityData";
import { sitemapPagesQuery } from "@/sanity/queries";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

type SitemapRow = {
	_id: string;
	_type: string;
	_updatedAt: string;
	slug: string | null;
	path: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [pages, siteLocale] = await Promise.all([
		client.fetch<SitemapRow[]>(sitemapPagesQuery),
		fetchSiteLanguageSettings({ stega: false }),
	]);
	const pathUtils = createLanguagePathUtils(siteLocale);

	const entries: MetadataRoute.Sitemap = [];

	for (const page of pages) {
		for (const locale of siteLocale.localeIds) {
			const pathname = pathUtils.localePath(page.path, locale);
			const url = `${BASE_URL}${pathname === "/" ? "" : pathname}`;
			entries.push({
				url: url.length > 0 ? url : BASE_URL,
				lastModified: page._updatedAt,
				changeFrequency: page._type === "home" ? "daily" : "weekly",
				priority: page._type === "home" ? 1.0 : 0.8,
			});
		}
	}

	return entries;
}
