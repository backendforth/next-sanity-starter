import {
	fetchErrorSettings,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";

import { LocaleNotFoundContent } from "./LocaleNotFoundContent";

/**
 * Server: cached Sanity settings only. The actual URL locale is resolved
 * client-side in `LocaleNotFoundContent` (`usePathname`) so we never call
 * `headers()` here — that would mark the whole `[locale]` segment as dynamic
 * and disable SSG for `/[locale]`. `errorSettings` is one document per
 * language, so every language's copy is fetched and the client picks the one
 * matching the URL.
 */
export default async function NotFound() {
	const siteLocale = await fetchSiteLanguageSettings();
	const errorSettingsByLocale = Object.fromEntries(
		await Promise.all(
			siteLocale.localeIds.map(
				async (locale) => [locale, await fetchErrorSettings(locale)] as const,
			),
		),
	);
	return (
		<LocaleNotFoundContent errorSettingsByLocale={errorSettingsByLocale} />
	);
}
