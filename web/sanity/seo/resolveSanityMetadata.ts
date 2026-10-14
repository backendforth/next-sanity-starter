import type { Metadata } from "next";
import { stegaClean } from "next-sanity";

import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { absoluteSiteUrl } from "@/src/utils/siteUrl";

import type { RouteDocument, SiteSettings } from "../types";
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
 * The brand, `siteSettings.title`, clean of stega markers — tab-title suffix and Open Graph
 * `siteName`. `"Site"` when unset.
 */
export function siteBrandTitle(site: SiteSettings | null | undefined): string {
	return stegaClean(site?.title)?.trim() || "Site";
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
	const heading = pickLocalizedString(data.title, locale, siteLocale);
	const title = stegaClean(
		firstNonEmpty(
			localizedSeoText(seo?.title, locale, siteLocale),
			siteSeoTitleFirst
				? localizedSeoText(settingsSeo?.title, locale, siteLocale)
				: undefined,
			heading,
		) ?? segmentFallback,
	);
	const description = stegaClean(
		firstNonEmpty(
			localizedSeoText(seo?.description, locale, siteLocale),
			localizedSeoText(settingsSeo?.description, locale, siteLocale),
		),
	);
	const ogImage = firstNonEmpty(seo?.imageUrl, settingsSeo?.imageUrl);
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
			...(ogImage ? { images: [{ url: ogImage }] } : {}),
		},
		twitter: {
			card: ogImage ? "summary_large_image" : "summary",
			title,
			description,
			...(ogImage ? { images: [ogImage] } : {}),
		},
	};
}
