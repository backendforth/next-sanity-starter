import { fetchErrorSettings } from "@/sanity/fetchSanityData";

import { LocaleNotFoundContent } from "./LocaleNotFoundContent";

/**
 * Server: cached Sanity settings only. Locale comes from the URL on the client
 * (`LocaleNotFoundContent`) so we never call `headers()` here — that would mark
 * the whole `[locale]` segment as dynamic and disable SSG for `/[locale]`.
 */
export default async function NotFound() {
	const errorSettings = await fetchErrorSettings();
	return <LocaleNotFoundContent errorSettings={errorSettings} />;
}
