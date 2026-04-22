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
