import {
	fetchErrorSettings,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";

import { LocaleNotFoundContent } from "./LocaleNotFoundContent";

/**
 * Server: cached Sanity settings only. The actual URL locale is resolved
 * client-side in `LocaleNotFoundContent` (`usePathname`) so we never call
 * `headers()` here — that would mark the whole `[locale]` segment as dynamic
 * and disable SSG for `/[locale]`. The server fetch uses the site default
 * locale; if it doesn't match the URL the client can still render the
 * generic fallback copy.
 */
export default async function NotFound() {
	const siteLocale = await fetchSiteLanguageSettings();
	const errorSettings = await fetchErrorSettings(siteLocale.defaultLocale);
	return <LocaleNotFoundContent errorSettings={errorSettings} />;
}
