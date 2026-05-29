"use client";

import * as CookieConsent from "vanilla-cookieconsent";

/** Open the preferences modal — wired to the `open-cookie-preferences` linkFunction. */
export function showCookiePreferences(): void {
	CookieConsent.showPreferences();
}

/** Whether the user has accepted a given category. Use to gate analytics/marketing scripts. */
export function hasConsent(category: string): boolean {
	return CookieConsent.acceptedCategory(category);
}
