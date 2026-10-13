"use client";

import type * as CookieConsent from "vanilla-cookieconsent";

type ConsentListener = (analyticsAccepted: boolean) => void;

type ConsentLibrary = Pick<
	typeof CookieConsent,
	"acceptedCategory" | "showPreferences"
>;

const listeners = new Set<ConsentListener>();

/**
 * Handed over by the banner once its lazy chunk has loaded.
 *
 * A module-level import of `vanilla-cookieconsent` here would pull the library
 * into every chunk that reads consent (`NavItem`, `SiteTracking`) and defeat
 * the lazy boundary in `LazyCookieConsentBanner`. Until the banner registers
 * it, nothing has consent, which is also what the library reports before
 * `run()`.
 */
let library: ConsentLibrary | null = null;

/** Called by `CookieConsentBanner` before it runs the banner. */
export function registerConsentLibrary(lib: ConsentLibrary): void {
	library = lib;
}

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
	const accepted = hasConsent("analytics");
	for (const listener of listeners) {
		listener(accepted);
	}
}

/** Whether the user has accepted a given category. Use to gate analytics/marketing scripts. */
export function hasConsent(category: string): boolean {
	return library?.acceptedCategory(category) ?? false;
}

/** Open the preferences modal — wired to the `open-cookie-preferences` linkFunction. */
export function showCookiePreferences(): void {
	// The link can be placed in navigation regardless of settings, but there is
	// nothing to show unless the banner is enabled and has started.
	if (!library) {
		console.warn(
			"[CookieConsent] Preferences unavailable — the banner is not enabled.",
		);
		return;
	}
	try {
		library.showPreferences();
	} catch (err) {
		console.warn("[CookieConsent] Preferences unavailable.", err);
	}
}
