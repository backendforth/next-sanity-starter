import {
	fetchErrorSettings,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { documentFontClassName } from "@/src/components/layout/DocumentShell";
import { LanguageProvider } from "@/src/contexts/LanguageContext";

import { LocaleNotFoundContent } from "./[locale]/LocaleNotFoundContent";
import "../assets/styles/tokens.css";
import "../assets/styles/globals.css";

/**
 * Root 404: the page Next renders for a URL that matched no route at all, or for an unknown
 * locale segment. The root layout is `[locale]/layout.tsx`, which cannot render without a
 * valid locale, so this page has no layout: it imports the stylesheets and font classes
 * itself and carries the body classes on its own wrapper. It must not render
 * `DocumentShell` — that would nest a second `<html>` inside Next's built-in shell.
 *
 * No header or footer. The copy follows the URL's locale prefix when it has one (via
 * `LocaleNotFoundContent`), otherwise the site default. `notFound()` raised inside a real page
 * still resolves to `[locale]/not-found.tsx` with the full site chrome.
 */
export default async function RootNotFound() {
	const [errorSettings, siteLocale] = await Promise.all([
		fetchErrorSettings(),
		fetchSiteLanguageSettings(),
	]);

	return (
		<div
			className={`flex min-h-dvh flex-col bg-color-bg font-text text-color-text antialiased ${documentFontClassName}`}
		>
			<LanguageProvider
				locale={siteLocale.defaultLocale}
				siteLocaleConfig={siteLocale}
			>
				<main id="main-content" className="flex min-h-0 flex-1 flex-col">
					<LocaleNotFoundContent errorSettings={errorSettings} />
				</main>
			</LanguageProvider>
		</div>
	);
}
