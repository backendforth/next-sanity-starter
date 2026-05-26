import type { Metadata } from "next";

import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

import type { HomeDocument, PageDocument, PageSeo } from "../types/pages";
import { pickLocalizedString } from "../utils/sanityLocalizedText";

const SITE_BASE_URL = (
	process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
).replace(/\/$/, "");

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
	/** Site-wide fallback from `siteSettings` (via `fetchSettingsSeoFallback`). */
	settingsSeo?: PageSeo;
	/** When meta title is not set on page or settings (e.g. localized H1 or slug). */
	titleFallback: string;
	/** When everything else is empty (e.g. missing singleton). */
	siteTitleFallback?: string;
	/** Site name for Open Graph (defaults to siteTitleFallback). */
	siteName?: string;
	/** Locale-agnostic path for the document (e.g. `"/"`, `"/about"`). Required for `alternates`. */
	path?: string;
	/** Active locale id for canonical URL. */
	currentLocale?: string;
	/** Site locale config used to build `hreflang` entries for every available language. */
	siteLocale?: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale"> | null;
};

function buildAlternates(
	path: string | undefined,
	currentLocale: string | undefined,
	siteLocale:
		| Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">
		| null
		| undefined,
): Metadata["alternates"] | undefined {
	if (!path || !currentLocale || !siteLocale) return undefined;
	const pathUtils = createLanguagePathUtils(siteLocale);
	const canonicalPath = pathUtils.localePath(path, currentLocale);
	const languages: Record<string, string> = {};
	for (const id of siteLocale.localeIds) {
		languages[id] = `${SITE_BASE_URL}${pathUtils.localePath(path, id)}`;
	}
	languages["x-default"] =
		`${SITE_BASE_URL}${pathUtils.localePath(path, siteLocale.defaultLocale)}`;
	return {
		canonical: `${SITE_BASE_URL}${canonicalPath}`,
		languages,
	};
}

/**
 * Next.js `Metadata` from merged Sanity SEO + Open Graph + Twitter cards + `hreflang` alternates.
 */
export function resolveSanityMetadata({
	seo,
	settingsSeo,
	titleFallback,
	siteTitleFallback = "Site",
	siteName,
	path,
	currentLocale,
	siteLocale,
}: ResolveSanityMetadataInput): Metadata {
	const merged = mergePageAndSettingsSeo(seo ?? null, settingsSeo ?? null);
	const metaTitle =
		merged.title?.trim() || titleFallback.trim() || siteTitleFallback;
	const description = merged.description?.trim() || undefined;
	const ogImage = merged.imageUrl?.trim() || undefined;
	const resolvedSiteName = siteName || siteTitleFallback;
	const alternates = buildAlternates(path, currentLocale, siteLocale);

	return {
		title: metaTitle,
		description,
		...(alternates ? { alternates } : {}),
		openGraph: {
			type: "website",
			siteName: resolvedSiteName,
			title: metaTitle,
			description,
			...(alternates?.canonical ? { url: alternates.canonical as string } : {}),
			...(currentLocale ? { locale: currentLocale } : {}),
			...(ogImage ? { images: [{ url: ogImage }] } : {}),
		},
		twitter: {
			card: ogImage ? "summary_large_image" : "summary",
			title: metaTitle,
			description,
			...(ogImage ? { images: [ogImage] } : {}),
		},
	};
}

export type MetadataFromSanityPageDataInput = {
	/** Route document (home singleton or `page` by slug). */
	data: HomeDocument | PageDocument;
	/** Active route locale id. */
	locale: string;
	/** Last-resort meta title (e.g. localized heading or slug) when SEO fields are empty. */
	segmentFallback: string;
	/** Site-wide SEO fallback from `siteSettings` (via `fetchSettingsSeoFallback`). */
	settingsSeo?: PageSeo;
	/** Locale config for `hreflang` alternates. */
	siteLocale?: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale"> | null;
	/** Locale-agnostic path (`/` for home, `/{slug}` for pages) — required for canonical + alternates. */
	path?: string;
	/** `siteSettings.title` — Open Graph `siteName` and last-resort meta title; tab suffix comes from layout `title.template`. */
	siteBrandTitle?: string | null;
};

/**
 * `pickLocalizedString` + `resolveSanityMetadata` for route documents (home singleton or
 * `page` by slug). Pass `settingsSeo` from `fetchSettingsSeoFallback` so empty page-level
 * SEO falls back to site settings.
 */
export function metadataFromSanityPageData({
	data,
	locale,
	segmentFallback,
	settingsSeo,
	siteLocale,
	path,
	siteBrandTitle,
}: MetadataFromSanityPageDataInput): Metadata {
	const heading = pickLocalizedString(data.title, locale, siteLocale);
	const brand = typeof siteBrandTitle === "string" ? siteBrandTitle.trim() : "";
	return resolveSanityMetadata({
		seo: data.seo,
		settingsSeo,
		titleFallback: heading || segmentFallback,
		path,
		currentLocale: locale,
		siteLocale: siteLocale ?? null,
		...(brand ? { siteTitleFallback: brand, siteName: brand } : {}),
	});
}
