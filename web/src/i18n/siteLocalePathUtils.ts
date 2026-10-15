import type { SiteLocaleConfig } from "./fallbackSiteLocales";

export type LanguagePathUtils = {
	defaultLocale: string;
	localeIds: readonly string[];
	isAppLocale: (value: string) => boolean;
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
		pathWithoutLocalePrefix,
		localePath,
		hrefFor,
	};
}
