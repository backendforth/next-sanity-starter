import { defaultLocale, isAppLocale, type AppLocale } from "./config";

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
