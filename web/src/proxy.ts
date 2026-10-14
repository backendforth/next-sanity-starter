import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { fetchSiteLocaleConfigForProxy } from "@/src/i18n/proxyLocaleFetch";

/** Cookie set by Next.js Draft Mode (`/api/draft-mode/enable`, Presentation preview). */
const DRAFT_MODE_COOKIE = "__prerender_bypass";

/**
 * - **Default locale** (from Sanity `siteLanguageSettings`): `/`, `/foo` — rewritten internally to `/{defaultLocale}`, `/{defaultLocale}/foo`.
 * - **Other locales**: `/{locale}`, `/{locale}/foo` — no rewrite.
 * - `/{defaultLocale}` and `/{defaultLocale}/*` redirect to unprefixed URLs (canonical).
 *
 * Locale config comes from the published (CDN-cached) `siteLanguageSettings` for
 * regular traffic; only Draft Mode requests (and dev) pay for a drafts-perspective
 * read so unpublished language changes stay previewable.
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

	const preferDrafts =
		process.env.NODE_ENV === "development" ||
		request.cookies.has(DRAFT_MODE_COOKIE);
	const { defaultLocale, localeIds } = await fetchSiteLocaleConfigForProxy({
		preferDrafts,
	});
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
		return NextResponse.next();
	}

	const url = request.nextUrl.clone();
	url.pathname =
		pathname === "/" ? defaultPrefix : `${defaultPrefix}${pathname}`;
	return NextResponse.rewrite(url);
}

export const config = {
	matcher: ["/((?!_next|.*\\..*).*)"],
};
