import { defaultLocale, type AppLocale } from "./config";

/**
 * Build a pathname for the current locale. Default locale has no prefix (`/` or `/about`).
 * German uses `/de` and `/de/about`.
 */
export function localePath(pathname: string, locale: AppLocale): string {
	const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
	if (locale === defaultLocale) {
		return normalized === "" ? "/" : normalized;
	}
	if (normalized === "/") {
		return `/${locale}`;
	}
	return `/${locale}${normalized}`;
}
