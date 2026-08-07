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
	// The link can be placed in navigation regardless of settings, but
	// showPreferences() has nothing to show unless run() started the banner.
	try {
		CookieConsent.showPreferences();
	} catch (err) {
		console.warn(
			"[CookieConsent] Preferences unavailable — the banner is not enabled.",
			err,
		);
	}
}
