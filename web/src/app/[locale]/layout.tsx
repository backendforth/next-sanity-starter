import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
	fetchSiteCookieBanner,
	fetchSiteLanguageSettings,
	fetchSiteNavMenus,
	fetchSiteSettingsTitle,
} from "@/sanity/fetchSanityData";
import { CookieConsentBanner } from "@/src/components/cookies/CookieConsent";
import { Footer } from "@/src/components/navigation/Footer";
import { Header } from "@/src/components/navigation/Header";
import { LanguageProvider } from "@/src/contexts/LanguageContext";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { skipLinkLabel } from "@/src/i18n/skipLinkLabel";

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

/** New locales from Sanity after deploy are still routable (not limited to `generateStaticParams` at build). */
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale: raw } = await params;
	const [siteLocale, siteTitle] = await Promise.all([
		fetchSiteLanguageSettings({ stega: false }),
		fetchSiteSettingsTitle({ stega: false }),
	]);
	const pathUtils = createLanguagePathUtils(siteLocale);
	if (!pathUtils.isAppLocale(raw)) {
		notFound();
	}
	const suffix = siteTitle.trim() || "Site";
	return {
		title: {
			default: suffix,
			template: `%s | ${suffix}`,
		},
	};
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale: raw } = await params;
	// Parallelize: locale config (for validation + LanguageProvider) and nav
	// menus are independent. The nav fetch when `raw` ends up invalid is
	// wasted effort but the path is rare (404s only); the common case saves a
	// roundtrip.
	const [siteLocale, siteNav, cookieBanner, siteBrand] = await Promise.all([
		fetchSiteLanguageSettings(),
		fetchSiteNavMenus(),
		fetchSiteCookieBanner(),
		fetchSiteSettingsTitle(),
	]);
	const pathUtils = createLanguagePathUtils(siteLocale);

	if (!pathUtils.isAppLocale(raw)) {
		notFound();
	}
	const locale = raw;

	return (
		<LanguageProvider locale={locale} siteLocaleConfig={siteLocale}>
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-xs focus:left-xs focus:z-50 focus:rounded focus:bg-color-bg focus:px-min focus:py-min focus:text-color-text focus:shadow-md focus:outline-2 focus:outline-offset-2 focus:outline-color-accent"
			>
				{skipLinkLabel(locale)}
			</a>
			<Header mainMenu={siteNav?.mainMenu} siteTitle={siteBrand} />
			<main
				id="main-content"
				className="flex min-h-0 flex-1 flex-col"
				tabIndex={-1}
			>
				{children}
			</main>
			<Footer
				locale={locale}
				footerMenu={siteNav?.footerMenu}
				pathUtils={pathUtils}
				siteLocale={siteLocale}
			/>
			<CookieConsentBanner doc={cookieBanner} locale={locale} />
		</LanguageProvider>
	);
}
