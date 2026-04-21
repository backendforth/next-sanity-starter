import {
	SITE_DEFAULT_LOCALE,
	SITE_LOCALES,
	type SiteLocaleCode,
} from "./site-locales";

export const locales = SITE_LOCALES;
export const defaultLocale = SITE_DEFAULT_LOCALE;
export type AppLocale = SiteLocaleCode;

export function isAppLocale(value: string): value is AppLocale {
	return (locales as readonly string[]).includes(value);
}

/** Set by `proxy.ts` for server components that still read the locale from headers (e.g. `not-found`). */
export const LOCALE_HEADER_NAME = "x-next-locale";
