"use client";

import { createContext, type ReactNode, useContext } from "react";

/** Whether the cookie banner runs: without it a cookie-preferences link has no modal to open. */
const CookieBannerContext = createContext(false);

/** Set once by `[locale]/layout.tsx`, from the same flag that mounts the banner. */
export function CookieBannerProvider({
	enabled,
	children,
}: {
	enabled: boolean;
	children: ReactNode;
}) {
	return (
		<CookieBannerContext.Provider value={enabled}>
			{children}
		</CookieBannerContext.Provider>
	);
}

/** `children` while the cookie banner runs, `fallback` otherwise. */
export function IfCookieBanner({
	children,
	fallback,
}: {
	children: ReactNode;
	fallback: ReactNode;
}) {
	return useContext(CookieBannerContext) ? children : fallback;
}
