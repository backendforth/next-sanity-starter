import type { Metadata } from "next";
import { stegaClean } from "next-sanity";

import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { SITE_BASE_URL } from "@/src/utils/siteUrl";

import type { PageSeo, RouteDocument, SiteSettings } from "../types";
import {
	type LocalizedEntry,
	pickLocalizedString,
} from "../utils/sanityLocalizedText";

type SiteLocaleSlice = Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
/** An SEO text field: i18n entries, or a plain string from before `migrate:seo-i18n`. */
type SeoText =
	| ReadonlyArray<LocalizedEntry<string>>
	| string
	| null
	| undefined;

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
 * One SEO text field in `locale`. Plain strings predate the i18n SEO fields
 * and apply to every locale until `migrate:seo-i18n` has run; any other shape
 * resolves to nothing instead of breaking metadata (and with it prerender).
 */
function localizedSeoText(
	value: SeoText,
	locale: string | undefined,
	siteLocale: SiteLocaleSlice | null | undefined,
): string | undefined {
	if (typeof value === "string") return value;
	if (!Array.isArray(value)) return undefined;
	return pickLocalizedString(value, locale, siteLocale);
}

/**
 * Merges local page `seo` with Sanity **site settings** fallback (`settingsSeo` from GROQ),
 * description resolved for `locale`. Empty strings are treated as missing so fallbacks
 * apply. The title has its own order, see `resolveSanityMetadata`.
 */
export function mergePageAndSettingsSeo(
	pageSeo: PageSeo,
	settingsSeo: PageSeo,
	locale?: string,
	siteLocale?: SiteLocaleSlice | null,
): {
	description?: string;
	imageUrl?: string;
} {
	return {
		description: firstNonEmpty(
			localizedSeoText(pageSeo?.description, locale, siteLocale),
			localizedSeoText(settingsSeo?.description, locale, siteLocale),
		),
		imageUrl: firstNonEmpty(pageSeo?.imageUrl, settingsSeo?.imageUrl),
	};
}

export type ResolveSanityMetadataInput = {
	/** Local `data.seo` from the page / singleton query. */
	seo?: PageSeo;
	/** Site-wide fallback, `siteSettings.seo` (`fetchSiteChrome`). */
	settingsSeo?: PageSeo;
	/** When the page has no meta title (e.g. localized H1 or slug). Wins over `settingsSeo.title`. */
	titleFallback: string;
	/** Brand: the last-resort title, and the tab-title suffix it must not repeat. */
	siteTitleFallback?: string;
	/** Home: the site-wide SEO title describes this page, so it wins over `titleFallback`. */
	siteSeoTitleFirst?: boolean;
	/** Site name for Open Graph (defaults to siteTitleFallback). */
	siteName?: string;
	/** Locale-agnostic path for the document (e.g. `"/"`, `"/about"`). Required for `alternates`. */
	path?: string;
	/** Active locale id for canonical URL and the localized SEO fields. */
	currentLocale?: string;
	/** Site locale config used to build `hreflang` entries for every available language. */
	siteLocale?: SiteLocaleSlice | null;
};

function buildAlternates(
	path: string | undefined,
	currentLocale: string | undefined,
	siteLocale: SiteLocaleSlice | null | undefined,
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
 * The brand, `siteSettings.title`, clean of stega markers — tab-title suffix, Open Graph
 * `siteName` and last-resort title. `"Site"` when unset.
 */
export function siteBrandTitle(site: SiteSettings | null | undefined): string {
	return stegaClean(site?.title)?.trim() || "Site";
}

/**
 * Next.js `Metadata` from merged Sanity SEO + Open Graph + Twitter cards + `hreflang` alternates.
 * Every string is cleaned of stega markers: the fetches are shared with the rendered page, so in
 * Draft Mode they carry them.
 */
export function resolveSanityMetadata({
	seo,
	settingsSeo,
	titleFallback,
	siteTitleFallback = "Site",
	siteSeoTitleFirst = false,
	siteName,
	path,
	currentLocale,
	siteLocale,
}: ResolveSanityMetadataInput): Metadata {
	const merged = mergePageAndSettingsSeo(
		seo ?? null,
		settingsSeo ?? null,
		currentLocale,
		siteLocale,
	);
	/* The page's own title beats the site-wide SEO title. That one is usually the brand, which
	 * the layout's `%s | brand` template would render as "Brand | Brand" on every page. */
	const pageTitle = localizedSeoText(seo?.title, currentLocale, siteLocale);
	const siteSeoTitle = localizedSeoText(
		settingsSeo?.title,
		currentLocale,
		siteLocale,
	);
	const brand = stegaClean(siteTitleFallback).trim();
	const metaTitle = stegaClean(
		(siteSeoTitleFirst
			? firstNonEmpty(pageTitle, siteSeoTitle, titleFallback)
			: firstNonEmpty(pageTitle, titleFallback, siteSeoTitle)) ?? brand,
	);
	const description = stegaClean(merged.description?.trim()) || undefined;
	const ogImage = stegaClean(merged.imageUrl?.trim()) || undefined;
	const resolvedSiteName = stegaClean(siteName) || brand;
	const alternates = buildAlternates(path, currentLocale, siteLocale);

	return {
		/* A title that already is the brand skips the template, which would repeat it. */
		title: metaTitle === brand ? { absolute: metaTitle } : metaTitle,
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
	/** Route document (home / work singletons or `page` / `project` by slug). */
	data: RouteDocument;
	/** Active route locale id. */
	locale: string;
	/** Meta title when the page has neither an SEO title nor a heading (e.g. the slug). */
	segmentFallback: string;
	/** `siteSettings` from `fetchSiteChrome`: SEO fallback and brand. */
	site?: SiteSettings | null;
	/** Locale config for `hreflang` alternates and SEO-field fallback order. */
	siteLocale?: SiteLocaleSlice | null;
	/** Home only: the site-wide SEO title wins over the heading. */
	siteSeoTitleFirst?: boolean;
};

/**
 * `pickLocalizedString` + `resolveSanityMetadata` for route documents (home / work
 * singletons or `page` / `project` by slug). Pass `site` (`fetchSiteChrome().settings`) so
 * empty page-level SEO falls back to site settings and the brand is known.
 */
export function metadataFromSanityPageData({
	data,
	locale,
	segmentFallback,
	site,
	siteLocale,
	siteSeoTitleFirst,
}: MetadataFromSanityPageDataInput): Metadata {
	const heading = pickLocalizedString(data.title, locale, siteLocale);
	const brand = siteBrandTitle(site);
	return resolveSanityMetadata({
		seo: data.seo,
		settingsSeo: site?.seo,
		titleFallback: heading || segmentFallback,
		siteSeoTitleFirst,
		/* `routePathProjection`: canonical + `hreflang` alternates. A path starts with `/`, so
		 * stega never encodes it. */
		path: data.path ?? undefined,
		currentLocale: locale,
		siteLocale: siteLocale ?? null,
		siteTitleFallback: brand,
		siteName: brand,
	});
}
