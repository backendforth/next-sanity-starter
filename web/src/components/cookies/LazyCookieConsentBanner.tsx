"use client";

import dynamic from "next/dynamic";

/**
 * `vanilla-cookieconsent` and its CSS, requested only when the layout renders the banner (Studio
 * toggle on). The banner always initialised after hydration, so `ssr: false` changes nothing.
 */
export const LazyCookieConsentBanner = dynamic(
	() => import("./CookieConsent").then((m) => m.CookieConsentBanner),
	{ ssr: false },
);
