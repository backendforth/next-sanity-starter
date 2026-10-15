import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stegaClean } from "next-sanity";

import {
	fetchSiteChrome,
	fetchSiteLanguageSettings,
} from "@/sanity/fetchSanityData";
import { siteBrand, siteBrandTitle } from "@/sanity/seo/resolveSanityMetadata";
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
import { CookieBannerProvider } from "@/src/contexts/CookieBannerContext";
import { LanguageProvider } from "@/src/contexts/LanguageContext";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { uiLabel } from "@/src/i18n/uiLabels";
import {
	resolveFooterMenuRows,
	resolveMainMenuEntries,
} from "@/src/utils/navHref";

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
	const siteLocale = await fetchSiteLanguageSettings();
	const pathUtils = createLanguagePathUtils(siteLocale);
	if (!pathUtils.isAppLocale(raw)) {
		notFound();
	}
	/* The chrome is per language: its cache key needs the validated locale. */
	const chrome = await fetchSiteChrome(raw);
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
	const siteLocale = await fetchSiteLanguageSettings();
	const pathUtils = createLanguagePathUtils(siteLocale);

	if (!pathUtils.isAppLocale(raw)) {
		notFound();
	}
	const locale = raw;
	const linkOptions = { locale, siteLocale };

	// `siteLocale` is shared by all locales (single doc). The chrome bundle (nav, cookie banner,
	// settings and analytics in one query) is per language, so it waits for the validated locale.
	const chrome = await fetchSiteChrome(locale);
	const siteNav = chrome?.nav ?? null;
	const cookieBanner = chrome?.cookieBanner ?? null;
	/* The banner, the cookie-preferences links (nav, rich text) and tracking follow this switch. */
	const cookieBannerEnabled = cookieBanner?.useCookieBanner === true;
	/* Clean: tracker ids and the load mode go to third-party scripts, not into the page. */
	const analytics = stegaClean(chrome?.analytics ?? null);
	const enabledTrackers = getEnabledTrackers(analytics);
	const navOptions = { ...linkOptions, cookieBannerEnabled };

	const site = (
		<LanguageProvider locale={locale} siteLocaleConfig={siteLocale}>
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-xs focus:left-xs focus:z-50 focus:rounded focus:bg-color-bg focus:px-sm focus:py-xs focus:text-color-text focus:shadow-md focus:outline-2 focus:outline-offset-2 focus:outline-color-accent"
			>
				{uiLabel("skipToMain", locale)}
			</a>
			<Header
				locale={locale}
				entries={resolveMainMenuEntries(siteNav?.mainMenu, navOptions)}
				homeHref={pathUtils.localePath("/", locale)}
				siteTitle={siteBrand(chrome?.settings)}
			/>
			<main
				id="main-content"
				className="flex min-h-0 flex-1 flex-col"
				tabIndex={-1}
			>
				{/* Rich-text cookie-preferences links read the switch here. */}
				<CookieBannerProvider enabled={cookieBannerEnabled}>
					{children}
				</CookieBannerProvider>
			</main>
			<Footer
				locale={locale}
				rows={resolveFooterMenuRows(siteNav?.footerMenu, navOptions)}
			/>
			{/* Only when the Studio toggle is on: the lazy chunk (JS + CSS) is
			 * otherwise never requested. A toggle flip reaches the page through
			 * the `siteCookieBanner` cache tag, without a deploy. */}
			{cookieBanner && cookieBannerEnabled ? (
				<LazyCookieConsentBanner
					locale={locale}
					translation={cookieConsentTranslation(
						cookieBanner,
						enabledTrackers,
						linkOptions,
					)}
				/>
			) : null}
			{enabledTrackers.length > 0 ? (
				<LazySiteTracking
					config={{
						analytics,
						cookieBanner: { useCookieBanner: cookieBannerEnabled },
					}}
				/>
			) : null}
		</LanguageProvider>
	);

	return <DocumentShell lang={locale}>{site}</DocumentShell>;
}
