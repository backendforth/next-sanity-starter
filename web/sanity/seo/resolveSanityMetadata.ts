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
	siteName,
	path,
	currentLocale,
	siteLocale,
	translations,
}: ResolveSanityMetadataInput): Metadata {
	const merged = mergePageAndSettingsSeo(seo ?? null, settingsSeo ?? null);
	const metaTitle =
		merged.title?.trim() || titleFallback.trim() || siteTitleFallback;
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
	/** Route document (home / work singletons or `page` / `project` by slug). */
	data: HomeDocument | PageDocument | WorkDocument | ProjectDocument;
	/** Active route locale id. */
	locale: string;
	/** Last-resort meta title (e.g. localized heading or slug) when SEO fields are empty. */
	segmentFallback: string;
	/** Site-wide SEO fallback from `siteSettings` (via `fetchSettingsSeoFallback`). */
	settingsSeo?: PageSeo;
	/** Locale config for `hreflang` alternates. */
	siteLocale?: SiteLocaleSlice | null;
	/** Locale-agnostic path (`/` for home, `/{slug}` for pages) — required for canonical + alternates. */
	path?: string;
	/** `siteSettings.title` — Open Graph `siteName` and last-resort meta title; tab suffix comes from layout `title.template`. */
	siteBrandTitle?: string | null;
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
}: MetadataFromSanityPageDataInput): Metadata {
	const heading = data.title?.trim() ?? "";
	const brand = typeof siteBrandTitle === "string" ? siteBrandTitle.trim() : "";
	return resolveSanityMetadata({
		seo: data.seo,
		settingsSeo,
		titleFallback: heading || segmentFallback,
		path,
		currentLocale: locale,
		siteLocale: siteLocale ?? null,
		translations: data.translations,
		...(brand ? { siteTitleFallback: brand, siteName: brand } : {}),
	});
}
