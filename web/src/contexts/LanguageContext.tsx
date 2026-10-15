"use client";

import { usePathname, useRouter } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
} from "react";

import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import {
	createLanguagePathUtils,
	type LanguagePathUtils,
} from "@/src/i18n/siteLocalePathUtils";

// ─── Types ───────────────────────────────────────────────────────────────────

type StudioLanguageOption = SiteLocaleConfig["languages"][number];

type LanguageContextValue = LanguagePathUtils & {
	/** The route's locale (`[locale]` segment), validated by the layout. */
	currentLocale: string;
	/** Options for the language switch (ids + labels). */
	languages: readonly StudioLanguageOption[];
	/** Navigate to the same logical path in another locale. */
	setLocale: (next: string) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
	children: ReactNode;
	/** The route's locale, validated by the layout. */
	locale: string;
	siteLocaleConfig: SiteLocaleConfig;
};

export function LanguageProvider({
	children,
	locale,
	siteLocaleConfig,
}: LanguageProviderProps) {
	const pathname = usePathname() ?? "/";
	const router = useRouter();

	const pathUtils = useMemo(
		() =>
			createLanguagePathUtils({
				defaultLocale: siteLocaleConfig.defaultLocale,
				localeIds: siteLocaleConfig.localeIds,
			}),
		[siteLocaleConfig.defaultLocale, siteLocaleConfig.localeIds],
	);

	const pathWithoutLocale = useMemo(
		() => pathUtils.pathWithoutLocalePrefix(pathname),
		[pathname, pathUtils],
	);

	const setLocale = useCallback(
		(next: string) => {
			if (!pathUtils.isAppLocale(next)) {
				return;
			}
			router.push(pathUtils.localePath(pathWithoutLocale, next));
		},
		[pathWithoutLocale, pathUtils, router],
	);

	const value = useMemo<LanguageContextValue>(
		() => ({
			...pathUtils,
			currentLocale: locale,
			languages: siteLocaleConfig.languages,
			setLocale,
		}),
		[locale, pathUtils, setLocale, siteLocaleConfig.languages],
	);

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const ctx = useContext(LanguageContext);
	if (!ctx) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return ctx;
}
