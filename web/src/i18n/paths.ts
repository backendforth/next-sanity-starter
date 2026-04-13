import { type AppLocale, defaultLocale, isAppLocale } from "./config";

/**
 * Locale implied by the visible URL (default locale has no prefix).
 */
export function localeFromPathname(pathname: string): AppLocale {
	const first = pathname.split("/").filter(Boolean)[0];
	if (first && isAppLocale(first) && first !== defaultLocale) {
		return first;
	}
	return defaultLocale;
}

/**
 * Visible URL path without a non-default locale prefix.
 * `/de/about` → `/about`; `/about` → `/about`; `/de` → `/`.
 */
export function pathWithoutLocalePrefix(pathname: string): string {
	const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
	const segments = normalized.split("/").filter(Boolean);
	const first = segments[0];
	if (first && isAppLocale(first) && first !== defaultLocale) {
		const rest = segments.slice(1);
		return rest.length === 0 ? "/" : `/${rest.join("/")}`;
	}
	return normalized;
}

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

/**
 * Normalize a pathname or internal href for equality checks (trailing slashes, etc.).
 */
export function normalizeComparablePathname(path: string): string {
	const withoutQueryHash = path.split("?")[0]?.split("#")[0] ?? "/";
	const withLeading = withoutQueryHash.startsWith("/")
		? withoutQueryHash
		: `/${withoutQueryHash}`;
	if (withLeading === "/" || withLeading === "") {
		return "/";
	}
	return withLeading.replace(/\/+$/, "");
}

/**
 * Whether a nav `href` points at the current URL (path and optional hash).
 * Internal paths are compared to `pathname` from `usePathname()`. Hash links (`#id`)
 * match when `locationHash` equals `href`. External `http(s):` URLs match only when
 * same-origin and the path matches.
 */
export function isCurrentNavHref(
	pathname: string,
	href: string,
	locationHash: string,
): boolean {
	const h = href.trim();
	if (h.startsWith("#")) {
		return locationHash === h;
	}
	if (/^https?:\/\//i.test(h)) {
		if (typeof window === "undefined") {
			return false;
		}
		try {
			const url = new URL(h);
			if (url.origin !== window.location.origin) {
				return false;
			}
			return (
				normalizeComparablePathname(pathname) ===
				normalizeComparablePathname(url.pathname)
			);
		} catch {
			return false;
		}
	}
	return (
		normalizeComparablePathname(pathname) === normalizeComparablePathname(h)
	);
}
