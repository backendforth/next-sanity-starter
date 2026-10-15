import { locale as rootLocale } from "next/root-params";

import {
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

import { NotFoundContent } from "./NotFoundContent";

/**
 * 404 inside the site chrome, in the route's language. `next/root-params` reads `[locale]`
 * without `headers()`, so the segment stays static; the chrome fetch is the layout's (React
 * `cache`). The layout has already validated the locale; the fallback only guards the type.
 */
export default async function NotFound() {
	const [raw, siteLocale, chrome] = await Promise.all([
		rootLocale(),
		fetchSiteLanguageSettings(),
		fetchSiteChrome(),
	]);
	const { isAppLocale, defaultLocale } = createLanguagePathUtils(siteLocale);
	return (
		<NotFoundContent
			copy={chrome?.notFound ?? null}
			locale={isAppLocale(raw) ? raw : defaultLocale}
			siteLocale={siteLocale}
		/>
	);
}
