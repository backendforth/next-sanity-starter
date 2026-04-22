import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { LOCALE_HEADER_NAME } from "@/src/i18n/config";
import { fetchSiteLocaleConfigForProxy } from "@/src/i18n/proxyLocaleFetch";

/**
 * - **Default locale** (from Sanity `siteLanguageSettings`): `/`, `/foo` — rewritten internally to `/{defaultLocale}`, `/{defaultLocale}/foo`.
 * - **Other locales**: `/{locale}`, `/{locale}/foo` — no rewrite.
 * - `/{defaultLocale}` and `/{defaultLocale}/*` redirect to unprefixed URLs (canonical).
 */
export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/api") ||
		/\.[^/]+$/.test(pathname)
	) {
		return NextResponse.next();
	}

	const { defaultLocale, localeIds } = await fetchSiteLocaleConfigForProxy();
	const localeSet = new Set(localeIds);
	const isKnownLocale = (v: string) => localeSet.has(v);
	const defaultPrefix = `/${defaultLocale}`;

	if (pathname === defaultPrefix || pathname.startsWith(`${defaultPrefix}/`)) {
		const stripped =
			pathname === defaultPrefix
				? "/"
				: pathname.slice(defaultPrefix.length) || "/";
		return NextResponse.redirect(new URL(stripped, request.url));
	}

	const first = pathname.split("/")[1];
	if (first && isKnownLocale(first) && first !== defaultLocale) {
		const requestHeaders = new Headers(request.headers);
		requestHeaders.set(LOCALE_HEADER_NAME, first);
		return NextResponse.next({
			request: { headers: requestHeaders },
		});
	}

	const url = request.nextUrl.clone();
	url.pathname =
		pathname === "/" ? defaultPrefix : `${defaultPrefix}${pathname}`;

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set(LOCALE_HEADER_NAME, defaultLocale);
	return NextResponse.rewrite(url);
}

export const config = {
	matcher: ["/((?!_next|.*\\..*).*)"],
};
