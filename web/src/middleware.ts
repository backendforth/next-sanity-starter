import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  defaultLocale,
  isAppLocale,
  LOCALE_HEADER_NAME,
} from "@/src/i18n/config";

const defaultPrefix = `/${defaultLocale}`;

/**
 * - **Default locale** (`defaultLocale` in `src/i18n/site-locales.ts`): `/`, `/foo` — rewritten internally to `/{defaultLocale}`, `/{defaultLocale}/foo`.
 * - **Other locales**: `/{locale}`, `/{locale}/foo` — no rewrite.
 * - `/{defaultLocale}` and `/{defaultLocale}/*` redirect to unprefixed URLs (canonical).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname === defaultPrefix || pathname.startsWith(`${defaultPrefix}/`)) {
    const stripped =
      pathname === defaultPrefix
        ? "/"
        : pathname.slice(defaultPrefix.length) || "/";
    return NextResponse.redirect(new URL(stripped, request.url));
  }

  const first = pathname.split("/")[1];
  if (first && isAppLocale(first) && first !== defaultLocale) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_HEADER_NAME, first);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/"
      ? defaultPrefix
      : `${defaultPrefix}${pathname}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER_NAME, defaultLocale);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
