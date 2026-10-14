"use client";

import dynamic from "next/dynamic";

import type { AnalyticsTracker, SiteCookieBanner } from "@/sanity/types";

/**
 * Lazy client boundary around the cookie banner.
 *
 * `vanilla-cookieconsent` and its CSS (imported by `CookieConsent.tsx`) used to
 * ship to every visitor on every route, even with the Studio toggle
 * (`siteCookieBanner.useCookieBanner`) off. With `ssr: false` the module is
 * only requested when this component mounts, and the locale layout only
 * renders it when the toggle is on.
 *
 * No compliance change: the banner always initialised after hydration
 * (`useEffect`), the lazy chunk just makes that explicit.
 */
const CookieConsentBanner = dynamic(
	() =>
		import("@/src/components/cookies/CookieConsent").then(
			(m) => m.CookieConsentBanner,
		),
	{ ssr: false },
);

type Props = {
	doc: SiteCookieBanner | null;
	locale: string;
	trackers?: AnalyticsTracker[];
};

export function LazyCookieConsentBanner({ doc, locale, trackers }: Props) {
	return <CookieConsentBanner doc={doc} locale={locale} trackers={trackers} />;
}
