import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { stegaClean } from "next-sanity";

import {
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";

import { NotFoundContent, notFoundTitle } from "./NotFoundContent";

/**
 * Tab title of every 404 under `[locale]` — unknown `[slug]`s and the `[...rest]` catch-all
 * included: for a 404 Next reads the layouts' metadata and this file's, never the page's.
 */
export async function generateMetadata(): Promise<Metadata> {
	const [locale, siteLocale, chrome] = await Promise.all([
		rootLocale(),
		fetchSiteLanguageSettings(),
		fetchSiteChrome(),
	]);
	return {
		title: stegaClean(notFoundTitle(chrome?.notFound, locale, siteLocale)),
	};
}

/**
 * 404 inside the site chrome, in the route's language. `next/root-params` reads `[locale]`
 * without `headers()`, so the segment stays static; the chrome fetch is the layout's (React
 * `cache`). The layout has already validated the locale: an invalid one never gets here.
 */
export default async function NotFound() {
	const [locale, siteLocale, chrome] = await Promise.all([
		rootLocale(),
		fetchSiteLanguageSettings(),
		fetchSiteChrome(),
	]);
	return (
		<NotFoundContent
			copy={chrome?.notFound ?? null}
			locale={locale}
			siteLocale={siteLocale}
		/>
	);
}
