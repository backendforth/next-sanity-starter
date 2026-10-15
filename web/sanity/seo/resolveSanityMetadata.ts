import type { Metadata } from "next";
import { stegaClean } from "next-sanity";

import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import {
	createLanguagePathUtils,
	type TranslationPath,
	translationPathsByLocale,
} from "@/src/i18n/siteLocalePathUtils";
import { absoluteSiteUrl } from "@/src/utils/siteUrl";

import type { RouteDocument, SiteSettings } from "../types";
import {
	buildFetchedImageUrl,
	resolveSanityImageFieldForUrl,
} from "../utils/sanityImageBuilder";

type SiteLocaleSlice = Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;

/** Open Graph's recommended 1.91:1 share image. */
const SHARE_IMAGE = { width: 1200, height: 630 };

/** The share image, cut with the editor's crop and hotspot. */
function shareImageUrl(image: unknown): string | null {
	const field = resolveSanityImageFieldForUrl(image);
	return field
		? buildFetchedImageUrl(field, {
				...SHARE_IMAGE,
				fit: "crop",
				format: "jpg",
				quality: 85,
			})
		: null;
}

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
		languages[id] = absoluteSiteUrl(path);
	}
	const defaultPath = byLocale[siteLocale.defaultLocale];
	if (defaultPath) languages["x-default"] = absoluteSiteUrl(defaultPath);
	return languages;
}

/**
 * The brand, `siteSettings.title`, clean of stega markers — tab-title suffix and Open Graph
 * `siteName`. `"Site"` when unset.
 */
export function siteBrandTitle(site: SiteSettings | null | undefined): string {
	return stegaClean(site?.title)?.trim() || "Site";
}

type MetadataFromSanityPageDataInput = {
	/** Route document (home / work singletons or `page` / `project` by slug). */
	data: RouteDocument;
	/** Active route locale id. */
	locale: string;
	/** Meta title when the page has neither an SEO title nor a heading (e.g. the slug). */
	segmentFallback: string;
	/** `siteSettings` from `fetchSiteChrome(locale)`: SEO fallback and brand. */
	site?: SiteSettings | null;
	/** Locale config — which `hreflang` ids are valid and which is `x-default`. */
	siteLocale: SiteLocaleSlice;
	/** Home only: the site-wide SEO title describes this page, so it wins over the heading. */
	siteSeoTitleFirst?: boolean;
};

/**
 * Route metadata: title, description, Open Graph, Twitter card and `hreflang` alternates from
 * the document's published translations. Empty page-level SEO falls back to `siteSettings.seo`.
 * The title goes page SEO title → (home: site SEO title) → heading → `segmentFallback`; the site
 * SEO title is usually the brand, which the layout's `%s | brand` template would repeat on every
 * other page. Fields are already in the route's language. Text is cleaned of stega markers: the
 * fetches are shared with the rendered page.
 */
export function metadataFromSanityPageData({
	data,
	locale,
	segmentFallback,
	site,
	siteLocale,
	siteSeoTitleFirst = false,
}: MetadataFromSanityPageDataInput): Metadata {
	const seo = data.seo;
	const settingsSeo = site?.seo;
	const brand = siteBrandTitle(site);
	const title = stegaClean(
		firstNonEmpty(
			seo?.title,
			siteSeoTitleFirst ? settingsSeo?.title : undefined,
			stegaClean(data.title),
		) ?? segmentFallback,
	);
	const description = stegaClean(
		firstNonEmpty(seo?.description, settingsSeo?.description),
	);
	const ogImage = firstNonEmpty(
		shareImageUrl(seo?.image),
		shareImageUrl(settingsSeo?.image),
	);
	/* `routePathProjection`; a path starts with `/`, so stega never encodes it. */
	const alternates = data.path
		? {
				canonical: absoluteSiteUrl(
					createLanguagePathUtils(siteLocale).localePath(data.path, locale),
				),
				languages: hreflangLanguages(
					{ language: locale, path: data.path },
					data.translations,
					siteLocale,
				),
			}
		: undefined;

	return {
		/* A page titled exactly like the brand skips the template, which would repeat it. */
		title: title === brand ? { absolute: title } : title,
		description,
		...(alternates ? { alternates } : {}),
		openGraph: {
			type: "website",
			siteName: brand,
			title,
			description,
			...(alternates ? { url: alternates.canonical } : {}),
			locale,
			...(ogImage ? { images: [{ url: ogImage, ...SHARE_IMAGE }] } : {}),
		},
		twitter: {
			card: ogImage ? "summary_large_image" : "summary",
			title,
			description,
			...(ogImage ? { images: [ogImage] } : {}),
		},
	};
}
