"use client";

import type { ReactNode } from "react";

import { showCookiePreferences } from "./cookieConsentApi";

/** The `open-cookie-preferences` link function inside rich text: inline text that opens the modal. */
export function CookiePreferencesButton({ children }: { children: ReactNode }) {
	return (
		<button
			type="button"
			className="rich-text-link"
			onClick={showCookiePreferences}
		>
			{children}
		</button>
	);
}
