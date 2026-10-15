import {
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { documentFontClassName } from "@/src/components/layout/DocumentShell";

import { NotFoundContent } from "./[locale]/NotFoundContent";
import "../assets/styles/tokens.css";
import "../assets/styles/globals.css";

/**
 * Root 404: the page Next renders for an unknown locale segment, or a URL that matched no route
 * at all. Unmatched paths under a valid locale don't land here: `[locale]/[...rest]` sends them
 * to `[locale]/not-found.tsx`, which can set `<html lang>`. The root layout is
 * `[locale]/layout.tsx`, which cannot render without a valid locale, so this page has no layout:
 * it imports the stylesheets itself and puts the `next/font` variables on its own wrapper, with
 * `font-text` there too (the base `body` rule sits above the variables and can't see them). It
 * must not render `DocumentShell` — that would nest a second `<html>` inside Next's built-in shell.
 *
 * No header or footer, and the copy is in the site's default locale: a URL with a valid locale
 * never lands here (the proxy rewrites unprefixed paths to the default locale, `[...rest]`
 * catches the rest). `notFound()` raised inside a real page resolves to
 * `[locale]/not-found.tsx` with the full site chrome.
 */
export default async function RootNotFound() {
	const siteLocale = await fetchSiteLanguageSettings();
	const chrome = await fetchSiteChrome(siteLocale.defaultLocale);

	return (
		<div
			className={`flex min-h-dvh flex-col font-text antialiased ${documentFontClassName}`}
		>
			<main id="main-content" className="flex min-h-0 flex-1 flex-col">
				<NotFoundContent
					copy={chrome?.notFound ?? null}
					locale={siteLocale.defaultLocale}
					siteLocale={siteLocale}
				/>
			</main>
		</div>
	);
}
