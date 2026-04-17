import type { MetadataRoute } from "next";
import { client } from "@/sanity/client";
import { sitemapPagesQuery } from "@/sanity/queries";
import { locales } from "@/src/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

type SitemapRow = {
	_id: string;
	_type: string;
	_updatedAt: string;
	slug: string | null;
	path: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const pages = await client.fetch<SitemapRow[]>(sitemapPagesQuery);

	const entries: MetadataRoute.Sitemap = [];

	for (const page of pages) {
		for (const locale of locales) {
			entries.push({
				url: `${BASE_URL}/${locale}${page.path === "/" ? "" : page.path}`,
				lastModified: page._updatedAt,
				changeFrequency: page._type === "home" ? "daily" : "weekly",
				priority: page._type === "home" ? 1.0 : 0.8,
			});
		}
	}

	return entries;
}
