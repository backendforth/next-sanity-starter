import type { Metadata } from "next";

import type { HomeDocument, PageDocument, PageSeo } from "../types/pages";
import { pickLocalizedString } from "../utils";

function firstNonEmpty(
	...values: (string | null | undefined)[]
): string | undefined {
	for (const v of values) {
		const t = v?.trim();
		if (t) return t;
	}
	return undefined;
}

/**
 * Merges local page `seo` with Sanity **site settings** fallback (`settingsSeo` from GROQ).
 * Empty strings are treated as missing so fallbacks apply.
 */
export function mergePageAndSettingsSeo(
	pageSeo: PageSeo,
	settingsSeo: PageSeo,
): {
	title?: string;
	description?: string;
	imageUrl?: string;
} {
	return {
		title: firstNonEmpty(pageSeo?.title, settingsSeo?.title),
		description: firstNonEmpty(pageSeo?.description, settingsSeo?.description),
		imageUrl: firstNonEmpty(pageSeo?.imageUrl, settingsSeo?.imageUrl),
	};
}

export type ResolveSanityMetadataInput = {
	/** Local `data.seo` from the page / singleton query. */
	seo?: PageSeo;
	/** `data.settingsSeo` (included in route `seoQuery`) — site-wide fallback. */
	settingsSeo?: PageSeo;
	/** When meta title is not set on page or settings (e.g. localized H1 or slug). */
	titleFallback: string;
	/** When everything else is empty (e.g. missing singleton). */
	siteTitleFallback?: string;
};

/**
 * Next.js `Metadata` from merged Sanity SEO + optional Open Graph image.
 */
export function resolveSanityMetadata({
	seo,
	settingsSeo,
	titleFallback,
	siteTitleFallback = "Site",
}: ResolveSanityMetadataInput): Metadata {
	const merged = mergePageAndSettingsSeo(seo ?? null, settingsSeo ?? null);
	const metaTitle =
		merged.title?.trim() || titleFallback.trim() || siteTitleFallback;
	const description = merged.description?.trim() || undefined;
	const ogImage = merged.imageUrl?.trim() || undefined;

	return {
		title: metaTitle,
		description,
		openGraph: {
			title: metaTitle,
			description,
			...(ogImage ? { images: [{ url: ogImage }] } : {}),
		},
	};
}

/**
 * `pickLocalizedString` + `resolveSanityMetadata` for route documents that include
 * `seo`, `settingsSeo`, and localized `title` (home singleton or `page` by slug).
 */
export function metadataFromSanityPageData(
	data: HomeDocument | PageDocument,
	locale: string,
	segmentFallback: string,
): Metadata {
	const heading = pickLocalizedString(data.title, locale);
	return resolveSanityMetadata({
		seo: data.seo,
		settingsSeo: data.settingsSeo,
		titleFallback: heading || segmentFallback,
	});
}
