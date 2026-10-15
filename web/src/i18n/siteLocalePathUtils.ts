import type { SiteLocaleConfig } from "./fallbackSiteLocales";

export type LanguagePathUtils = {
	defaultLocale: string;
	localeIds: readonly string[];
	isAppLocale: (value: string) => boolean;
	localeFromPathname: (pathname: string) => string;
	pathWithoutLocalePrefix: (pathname: string) => string;
	localePath: (pathname: string, locale: string) => string;
	/** `localePath` for a GROQ `path` (`routePathProjection`); `null` stays `null`, i.e. no link. */
	hrefFor: (path: string | null | undefined, locale: string) => string | null;
};

/**
 * Pure helpers for URL ↔ locale (default locale has no prefix).
 */
export function createLanguagePathUtils(
	config: Pick<SiteLocaleConfig, "defaultLocale" | "localeIds">,
): LanguagePathUtils {
	const { defaultLocale, localeIds } = config;
	const set = new Set(localeIds);

	function isAppLocale(value: string): boolean {
		return set.has(value);
	}

	function localeFromPathname(pathname: string): string {
		const first = pathname.split("/").filter(Boolean)[0];
		if (first && isAppLocale(first) && first !== defaultLocale) {
			return first;
		}
		return defaultLocale;
	}

	function pathWithoutLocalePrefix(pathname: string): string {
		const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
		const segments = normalized.split("/").filter(Boolean);
		const first = segments[0];
		if (first && isAppLocale(first) && first !== defaultLocale) {
			const rest = segments.slice(1);
			return rest.length === 0 ? "/" : `/${rest.join("/")}`;
		}
		return normalized;
	}

	function localePath(pathname: string, locale: string): string {
		const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
		if (locale === defaultLocale) {
			return normalized === "" ? "/" : normalized;
		}
		if (normalized === "/") {
			return `/${locale}`;
		}
		return `/${locale}${normalized}`;
	}

	function hrefFor(
		path: string | null | undefined,
		locale: string,
	): string | null {
		return path ? localePath(path, locale) : null;
	}

	return {
		defaultLocale,
		localeIds,
		isAppLocale,
		localeFromPathname,
		pathWithoutLocalePrefix,
		localePath,
		hrefFor,
	};
}

/** One language variant of a document — see `translationsQuery`. */
export type TranslationPath = {
	language?: string | null;
	path?: string | null;
} | null;

/**
 * Locale id → URL path (locale prefix applied) for every variant whose
 * language is a site locale and that has a path. Slugs differ per language
 * under document-level translation, so alternates come from here, never from
 * swapping the prefix of the current path. Ordered by `localeIds`; the first
 * entry per language wins.
 */
export function translationPathsByLocale(
	translations: readonly TranslationPath[] | null | undefined,
	pathUtils: LanguagePathUtils,
): Record<string, string> {
	const found = new Map<string, string>();
	for (const entry of translations ?? []) {
		const language = entry?.language?.trim();
		const path = entry?.path?.trim();
		if (!language || !path || found.has(language)) continue;
		if (!pathUtils.isAppLocale(language)) continue;
		found.set(language, pathUtils.localePath(path, language));
	}
	const byLocale: Record<string, string> = {};
	for (const id of pathUtils.localeIds) {
		const path = found.get(id);
		if (path) byLocale[id] = path;
	}
	return byLocale;
}
