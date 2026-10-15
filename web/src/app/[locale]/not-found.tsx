import { locale as rootLocale } from "next/root-params";

import {
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";

import { NotFoundContent } from "./NotFoundContent";

/**
 * 404 inside the site chrome, in the route's language. `next/root-params` reads `[locale]`
 * without `headers()`, so the segment stays static, and the chrome fetch for that locale is
 * the layout's (React `cache`). The layout has already validated the locale: an invalid one
 * never gets here.
 */
export default async function NotFound() {
	const locale = await rootLocale();
	const [siteLocale, chrome] = await Promise.all([
		fetchSiteLanguageSettings(),
		fetchSiteChrome(locale),
	]);
	return (
		<NotFoundContent
			copy={chrome?.notFound ?? null}
			locale={locale}
			siteLocale={siteLocale}
		/>
	);
}
