import { locale as rootLocale } from "next/root-params";

import {
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

import { NotFoundContent } from "./NotFoundContent";

/**
 * 404 inside the site chrome, in the route's language. `next/root-params` reads `[locale]`
 * without `headers()`, so the segment stays static, and the chrome fetch for that locale is
 * the layout's (React `cache`). The layout has already validated the locale; the fallback only
 * guards the type.
 */
export default async function NotFound() {
	const [raw, siteLocale] = await Promise.all([
		rootLocale(),
		fetchSiteLanguageSettings(),
	]);
	const { isAppLocale, defaultLocale } = createLanguagePathUtils(siteLocale);
	const locale = isAppLocale(raw) ? raw : defaultLocale;
	const chrome = await fetchSiteChrome(locale);
	return (
		<NotFoundContent
			copy={chrome?.notFound ?? null}
			locale={locale}
			siteLocale={siteLocale}
		/>
	);
}
