import type { SiteLocaleConfig } from "./fallbackSiteLocales";

export type LanguagePathUtils = {
	defaultLocale: string;
	localeIds: readonly string[];
	isAppLocale: (value: string) => boolean;
	localeFromPathname: (pathname: string) => string;
	pathWithoutLocalePrefix: (pathname: string) => string;
	localePath: (pathname: string, locale: string) => string;
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

	return {
		defaultLocale,
		localeIds,
		isAppLocale,
		localeFromPathname,
		pathWithoutLocalePrefix,
		localePath,
	};
}
