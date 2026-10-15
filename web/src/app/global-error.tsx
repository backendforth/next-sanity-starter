"use client";

import { useEffect } from "react";

import { documentFontClassName } from "@/src/components/layout/documentFonts";
import { ThemeSync } from "@/src/components/theme/ThemeSync";
import { FALLBACK_SITE_LOCALE_CONFIG } from "@/src/i18n/fallbackSiteLocales";

import { ErrorContent } from "./[locale]/ErrorContent";
import "../assets/styles/tokens.css";
import "../assets/styles/globals.css";

/* The root layout failed, so neither the route's locale nor the site settings are known. */
const LOCALE = FALLBACK_SITE_LOCALE_CONFIG.defaultLocale;

/**
 * Stands in for the root layout when it throws, so it renders its own `<html>` / `<body>` with
 * `DocumentShell`'s classes, imports the stylesheets like `app/not-found.tsx`, and puts the
 * stored colour scheme back (`ThemeSync`).
 */
export default function GlobalErrorBoundary({
	error,
	reset,
}: {
	error: globalThis.Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Global error:", error);
	}, [error]);

	return (
		<html
			lang={LOCALE}
			className={`h-full antialiased ${documentFontClassName}`}
		>
			<body className="min-h-full flex flex-col">
				<ThemeSync />
				<main id="main-content" className="flex min-h-0 flex-1 flex-col">
					<ErrorContent locale={LOCALE} homeHref="/" onRetry={reset} />
				</main>
			</body>
		</html>
	);
}
