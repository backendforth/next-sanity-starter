import type { Metadata } from "next";

import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import {
	createLanguagePathUtils,
	type TranslationPath,
	translationPathsByLocale,
} from "@/src/i18n/siteLocalePathUtils";
import { SITE_BASE_URL } from "@/src/utils/siteUrl";

import type {
	DocumentTranslation,
	HomeDocument,
	PageDocument,
	PageSeo,
	ProjectDocument,
	WorkDocument,
} from "../types/pages";

type SiteLocaleSlice = Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;

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
 * Empty strings are treated as missing so fallbacks apply. The title has its own order, see
 * `resolveSanityMetadata`.
 */
export function mergePageAndSettingsSeo(
	pageSeo: PageSeo,
	settingsSeo: PageSeo,
): {
	description?: string;
	imageUrl?: string;
} {
	return {
		description: firstNonEmpty(pageSeo?.description, settingsSeo?.description),
		imageUrl: firstNonEmpty(pageSeo?.imageUrl, settingsSeo?.imageUrl),
	};
}

export type ResolveSanityMetadataInput = {
	/** Local `data.seo` from the page / singleton query. */
	seo?: PageSeo;
	/** Site-wide fallback from `siteSettings` (via `fetchSettingsSeoFallback`). */
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
	/** Active locale id for canonical URL. */
	currentLocale?: string;
	/** Site locale config — which `hreflang` ids are valid and which is `x-default`. */
	siteLocale?: SiteLocaleSlice | null;
	/** Published language variants of the document (`translationsQuery`) for `hreflang`. */
	translations?: readonly DocumentTranslation[] | null;
};

/**
 * `hreflang` map for one document: an absolute URL per published language
 * variant, plus `x-default` → the default-language variant when there is one.
 * Each language has its own document and slug here, so only variants that
 * exist are listed — never the current path under every prefix. `self` always
 * counts, so a document without linked translations still points at itself.
 */
export function hreflangLanguages(
	self: { language: string; path: string },
	translations: readonly TranslationPath[] | null | undefined,
	siteLocale: SiteLocaleSlice,
): Record<string, string> {
	const byLocale = translationPathsByLocale(
		[self, ...(translations ?? [])],
		createLanguagePathUtils(siteLocale),
	);
	const languages: Record<string, string> = {};
	for (const [id, path] of Object.entries(byLocale)) {
		languages[id] = `${SITE_BASE_URL}${path}`;
	}
	const defaultPath = byLocale[siteLocale.defaultLocale];
	if (defaultPath) languages["x-default"] = `${SITE_BASE_URL}${defaultPath}`;
	return languages;
}

function buildAlternates(
	path: string | undefined,
	currentLocale: string | undefined,
	siteLocale: SiteLocaleSlice | null | undefined,
	translations: readonly DocumentTranslation[] | null | undefined,
): Metadata["alternates"] | undefined {
	if (!path || !currentLocale || !siteLocale) return undefined;
	const pathUtils = createLanguagePathUtils(siteLocale);
	return {
		canonical: `${SITE_BASE_URL}${pathUtils.localePath(path, currentLocale)}`,
		languages: hreflangLanguages(
			{ language: currentLocale, path },
			translations,
			siteLocale,
		),
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
	siteSeoTitleFirst = false,
	siteName,
	path,
	currentLocale,
	siteLocale,
	translations,
}: ResolveSanityMetadataInput): Metadata {
	const merged = mergePageAndSettingsSeo(seo ?? null, settingsSeo ?? null);
	/* The page's own title beats the site-wide SEO title. That one is usually the brand, which
	 * the layout's `%s | brand` template would render as "Brand | Brand" on every page. */
	const pageTitle = seo?.title;
	const siteSeoTitle = settingsSeo?.title;
	const metaTitle =
		(siteSeoTitleFirst
			? firstNonEmpty(pageTitle, siteSeoTitle, titleFallback)
			: firstNonEmpty(pageTitle, titleFallback, siteSeoTitle)) ??
		siteTitleFallback;
	const description = merged.description?.trim() || undefined;
	const ogImage = merged.imageUrl?.trim() || undefined;
	const resolvedSiteName = siteName || siteTitleFallback;
	const alternates = buildAlternates(
		path,
		currentLocale,
		siteLocale,
		translations,
	);

	return {
		/* A title that already is the brand skips the template, which would repeat it. */
		title:
			metaTitle === siteTitleFallback.trim()
				? { absolute: metaTitle }
				: metaTitle,
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
	data: HomeDocument | PageDocument | WorkDocument | ProjectDocument;
	/** Active route locale id. */
	locale: string;
	/** Meta title when the page has neither an SEO title nor a heading (e.g. the slug). */
	segmentFallback: string;
	/** Site-wide SEO fallback from `siteSettings` (via `fetchSettingsSeoFallback`). */
	settingsSeo?: PageSeo;
	/** Locale config for `hreflang` alternates. */
	siteLocale?: SiteLocaleSlice | null;
	/** Locale-agnostic path (`/` for home, `/{slug}` for pages) — required for canonical + alternates. */
	path?: string;
	/** `siteSettings.title` — Open Graph `siteName` and last-resort meta title; tab suffix comes from layout `title.template`. */
	siteBrandTitle?: string | null;
	/** Home only: the site-wide SEO title wins over the heading. */
	siteSeoTitleFirst?: boolean;
};

/**
 * `resolveSanityMetadata` for route documents (home singleton or `page` by slug).
 * Pass `settingsSeo` from `fetchSettingsSeoFallback` so empty page-level SEO
 * falls back to site settings. Under document-level translation `data.title` is
 * already in the active locale (no resolver needed).
 */
export function metadataFromSanityPageData({
	data,
	locale,
	segmentFallback,
	settingsSeo,
	siteLocale,
	path,
	siteBrandTitle,
	siteSeoTitleFirst,
}: MetadataFromSanityPageDataInput): Metadata {
	const heading = data.title?.trim() ?? "";
	const brand = typeof siteBrandTitle === "string" ? siteBrandTitle.trim() : "";
	return resolveSanityMetadata({
		seo: data.seo,
		settingsSeo,
		titleFallback: heading || segmentFallback,
		siteSeoTitleFirst,
		path,
		currentLocale: locale,
		siteLocale: siteLocale ?? null,
		translations: data.translations,
		...(brand ? { siteTitleFallback: brand, siteName: brand } : {}),
	});
}
