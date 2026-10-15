import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stegaClean } from "next-sanity";

import {
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { siteBrandTitle } from "@/sanity/seo/resolveSanityMetadata";
import { LazyCookieConsentBanner } from "@/src/components/cookies/LazyCookieConsentBanner";
import {
	DocumentShell,
	documentMetadata,
} from "@/src/components/layout/DocumentShell";
import { Footer } from "@/src/components/navigation/Footer";
import { Header } from "@/src/components/navigation/Header";
import { LazySiteTracking } from "@/src/components/tracking/LazySiteTracking";
import { cookieConsentTranslation } from "@/src/components/tracking/lib/cookieConsentConfig";
import { getEnabledTrackers } from "@/src/components/tracking/lib/trackingConfig";
import { LanguageProvider } from "@/src/contexts/LanguageContext";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { skipLinkLabel } from "@/src/i18n/skipLinkLabel";

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

/** New locales from Sanity after deploy are still routable (not limited to `generateStaticParams` at build). */
export const dynamicParams = true;

/*
 * This is the root layout: it renders `<html lang={locale}>` through `DocumentShell`, so the
 * server markup carries the route's language. See `DocumentShell` for why, and for the root
 * `app/not-found.tsx` that this layout cannot wrap.
 */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale: raw } = await params;
	const [siteLocale, chrome] = await Promise.all([
		fetchSiteLanguageSettings(),
		fetchSiteChrome(),
	]);
	const pathUtils = createLanguagePathUtils(siteLocale);
	if (!pathUtils.isAppLocale(raw)) {
		notFound();
	}
	const suffix = siteBrandTitle(chrome?.settings);
	return {
		...documentMetadata(chrome?.settings?.favicon),
		title: {
			default: suffix,
			template: `%s | ${suffix}`,
		},
	};
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale: raw } = await params;
	// Parallelize: locale config (for validation + LanguageProvider) and the chrome bundle
	// (nav, cookie banner, settings, analytics, 404 copy in one query) are independent. The
	// fetch when `raw` ends up invalid is wasted effort but the path is rare (404s only); the
	// common case saves a roundtrip.
	const [siteLocale, chrome] = await Promise.all([
		fetchSiteLanguageSettings(),
		fetchSiteChrome(),
	]);
	const siteNav = chrome?.nav ?? null;
	const cookieBanner = chrome?.cookieBanner ?? null;
	/* Rendered, so it keeps its stega markers; the header brand is never empty. */
	const siteBrand = chrome?.settings?.title?.trim() || "Site";
	/* Clean: tracker ids and the load mode go to third-party scripts, not into the page. */
	const analytics = stegaClean(chrome?.analytics ?? null);
	const enabledTrackers = getEnabledTrackers(analytics);
	const pathUtils = createLanguagePathUtils(siteLocale);

	if (!pathUtils.isAppLocale(raw)) {
		notFound();
	}
	const locale = raw;

	const site = (
		<LanguageProvider locale={locale} siteLocaleConfig={siteLocale}>
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-xs focus:left-xs focus:z-50 focus:rounded focus:bg-color-bg focus:px-sm focus:py-xs focus:text-color-text focus:shadow-md focus:outline-2 focus:outline-offset-2 focus:outline-color-accent"
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
			{/* Only when the Studio toggle is on: the lazy chunk (JS + CSS) is
			 * otherwise never requested. A toggle flip reaches the page through
			 * the `siteCookieBanner` cache tag, without a deploy. */}
			{cookieBanner?.useCookieBanner ? (
				<LazyCookieConsentBanner
					locale={locale}
					translation={cookieConsentTranslation(cookieBanner, enabledTrackers, {
						locale,
						siteLocale,
					})}
				/>
			) : null}
			{enabledTrackers.length > 0 ? (
				<LazySiteTracking
					config={{
						analytics,
						cookieBanner: cookieBanner && {
							useCookieBanner: cookieBanner.useCookieBanner,
						},
					}}
				/>
			) : null}
		</LanguageProvider>
	);

	return <DocumentShell lang={locale}>{site}</DocumentShell>;
}
