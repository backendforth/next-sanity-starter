import type { Metadata } from "next";
import { stegaClean } from "next-sanity";

import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { absoluteSiteUrl } from "@/src/utils/siteUrl";

import type { RouteDocument, SiteSettings } from "../types";
import {
	buildFetchedImageUrl,
	resolveSanityImageFieldForUrl,
} from "../utils/sanityImageBuilder";
import { pickLocalizedString, plainText } from "../utils/sanityLocalizedText";

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

/**
 * `hreflang` map for one document: its path under every site locale, plus `x-default` → the
 * default locale. Field-level i18n renders every locale from the same document, so each
 * language is listed. Used by route metadata and the sitemap.
 */
export function hreflangLanguages(
	path: string,
	siteLocale: SiteLocaleSlice,
): Record<string, string> {
	const { localePath } = createLanguagePathUtils(siteLocale);
	const languages: Record<string, string> = {};
	for (const id of siteLocale.localeIds) {
		languages[id] = absoluteSiteUrl(localePath(path, id));
	}
	languages["x-default"] = absoluteSiteUrl(
		localePath(path, siteLocale.defaultLocale),
	);
	return languages;
}

/**
 * The brand, `siteSettings.title`, as the header renders it (stega markers kept); `"Site"` when
 * unset.
 */
export function siteBrand(site: SiteSettings | null | undefined): string {
	return plainText(site?.title) ?? "Site";
}

/** {@link siteBrand} clean of stega markers — tab-title suffix and Open Graph `siteName`. */
export function siteBrandTitle(site: SiteSettings | null | undefined): string {
	return stegaClean(siteBrand(site));
}

type MetadataFromSanityPageDataInput = {
	/** Route document (home / work singletons or `page` / `project` by slug). */
	data: RouteDocument;
	/** Active route locale id. */
	locale: string;
	/** Meta title when the page has neither an SEO title nor a heading (e.g. the slug). */
	segmentFallback: string;
	/** `siteSettings` from `fetchSiteChrome`: SEO fallback and brand. */
	site?: SiteSettings | null;
	/** Locale config for `hreflang` alternates and SEO-field fallback order. */
	siteLocale: SiteLocaleSlice;
	/** Home only: the site-wide SEO title describes this page, so it wins over the heading. */
	siteSeoTitleFirst?: boolean;
};

/**
 * Route metadata: title, description, Open Graph, Twitter card and `hreflang` alternates.
 * Empty page-level SEO falls back to `siteSettings.seo`. The title goes page SEO title →
 * (home: site SEO title) → heading → `segmentFallback`; the site SEO title is usually the brand,
 * which the layout's `%s | brand` template would repeat on every other page. Text is cleaned of
 * stega markers: the fetches are shared with the rendered page.
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
	const pick = (entries: Parameters<typeof pickLocalizedString>[0]) =>
		pickLocalizedString(entries, locale, siteLocale);
	const title = stegaClean(
		pick(seo?.title) ??
			(siteSeoTitleFirst ? pick(settingsSeo?.title) : undefined) ??
			pick(data.title) ??
			segmentFallback,
	);
	const description = stegaClean(
		pick(seo?.description) ?? pick(settingsSeo?.description),
	);
	const ogImage =
		shareImageUrl(seo?.image) ?? shareImageUrl(settingsSeo?.image);
	/* `routePathProjection`; a path starts with `/`, so stega never encodes it. */
	const alternates = data.path
		? {
				canonical: absoluteSiteUrl(
					createLanguagePathUtils(siteLocale).localePath(data.path, locale),
				),
				languages: hreflangLanguages(data.path, siteLocale),
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
