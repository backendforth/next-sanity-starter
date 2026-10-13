import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
	fetchSiteAnalyticsSettings,
	fetchSiteChrome,
	fetchSiteLanguageSettings,
	fetchSiteSettingsTitle,
} from "@/sanity/fetchSanityData";
import { LazyCookieConsentBanner } from "@/src/components/cookies/LazyCookieConsentBanner";
import {
	DocumentShell,
	documentMetadata,
} from "@/src/components/layout/DocumentShell";
import { Footer } from "@/src/components/navigation/Footer";
import { Header } from "@/src/components/navigation/Header";
import { getEnabledTrackers } from "@/src/components/tracking/lib/trackingConfig";
import { SiteTrackingShell } from "@/src/components/tracking/SiteTrackingShell";
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
	const siteLocale = await fetchSiteLanguageSettings({ stega: false });
	const pathUtils = createLanguagePathUtils(siteLocale);
	if (!pathUtils.isAppLocale(raw)) {
		notFound();
	}
	const [siteTitle, documentMeta] = await Promise.all([
		fetchSiteSettingsTitle(raw, { stega: false }),
		documentMetadata(siteLocale.defaultLocale),
	]);
	const suffix = siteTitle.trim() || "Site";
	return {
		...documentMeta,
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

	// `siteLocale` is shared by all locales (single doc). The chrome bundle (nav,
	// cookie banner, title in one query) is per language, so it waits for the
	// validated locale; analytics (one singleton) joins the same round.
	const [chrome, analytics] = await Promise.all([
		fetchSiteChrome(locale),
		fetchSiteAnalyticsSettings(),
	]);
	const siteNav = chrome?.nav ?? null;
	const cookieBanner = chrome?.cookieBanner ?? null;
	/* Same fallback as `fetchSiteSettingsTitle`: the header brand is never empty. */
	const siteBrand = chrome?.title?.trim() || "Site";
	const enabledTrackers = getEnabledTrackers(analytics);

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
					doc={cookieBanner}
					locale={locale}
					trackers={enabledTrackers}
				/>
			) : null}
			<SiteTrackingShell locale={locale} />
		</LanguageProvider>
	);

	return <DocumentShell lang={locale}>{site}</DocumentShell>;
}
