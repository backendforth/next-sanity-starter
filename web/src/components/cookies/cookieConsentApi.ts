"use client";

import * as CookieConsent from "vanilla-cookieconsent";

type ConsentListener = (analyticsAccepted: boolean) => void;

const listeners = new Set<ConsentListener>();

/** Subscribe to analytics consent changes (after CookieConsent.run). */
export function subscribeAnalyticsConsent(
	listener: ConsentListener,
): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/** Called from CookieConsentBanner when consent changes. */
export function notifyAnalyticsConsentChange(): void {
	const accepted = CookieConsent.acceptedCategory("analytics");
	for (const listener of listeners) {
		listener(accepted);
	}
}

/** Whether the user has accepted a given category. Use to gate analytics/marketing scripts. */
export function hasConsent(category: string): boolean {
	return CookieConsent.acceptedCategory(category);
}

/** Open the preferences modal — wired to the `open-cookie-preferences` linkFunction. */
export function showCookiePreferences(): void {
	CookieConsent.showPreferences();
}
