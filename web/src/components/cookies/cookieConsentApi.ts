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

/** Set once the current `CookieConsent.run()` has resolved — `showPreferences` needs a started banner. */
let started = false;

/**
 * A preferences click that arrived before the banner started. Navigation hydrates
 * and takes clicks while the lazy banner chunk may still be downloading, so the
 * request is kept and served on start instead of being dropped.
 */
let preferencesRequested = false;

/**
 * Called by `CookieConsentBanner` before every `run()`, a restart after a language switch
 * included: until that run resolves, `showCookiePreferences` queues instead of opening.
 * Consent reads stay valid throughout — `run()` restores the categories from the cookie
 * synchronously.
 */
export function registerConsentLibrary(lib: ConsentLibrary): void {
	library = lib;
	started = false;
}

/** Called by `CookieConsentBanner` once `run()` has resolved. */
export function markConsentLibraryStarted(): void {
	started = true;
	if (!preferencesRequested) return;
	preferencesRequested = false;
	openPreferences();
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

function openPreferences(): void {
	try {
		library?.showPreferences();
	} catch (err) {
		console.warn("[CookieConsent] Preferences unavailable.", err);
	}
}

/** Open the preferences modal — wired to the `open-cookie-preferences` linkFunction. */
export function showCookiePreferences(): void {
	// The link can be placed in navigation regardless of settings. With the banner
	// enabled but not started yet (lazy chunk in flight), open the modal on start;
	// with the banner disabled nothing ever starts and the click stays a no-op.
	if (!library || !started) {
		preferencesRequested = true;
		return;
	}
	openPreferences();
}
