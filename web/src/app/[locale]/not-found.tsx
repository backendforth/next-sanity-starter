import { fetchNotFoundCopy } from "@/sanity/fetchSanityData";

import { LocaleNotFoundContent } from "./LocaleNotFoundContent";

/**
 * Server: cached Sanity settings only. The actual URL locale is resolved
 * client-side in `LocaleNotFoundContent` (`usePathname`) so we never call
 * `headers()` here — that would mark the whole `[locale]` segment as dynamic
 * and disable SSG for `/[locale]`. `errorSettings` is one document per
 * language, so every language's copy is fetched (in one query) and the client
 * picks the one matching the URL.
 */
export default async function NotFound() {
	const copies = await fetchNotFoundCopy();
	return <LocaleNotFoundContent copies={copies} />;
}
