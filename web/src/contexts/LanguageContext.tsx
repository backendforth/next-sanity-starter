"use client";

import { usePathname, useRouter } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
} from "react";

import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import {
	createLanguagePathUtils,
	type LanguagePathUtils,
} from "@/src/i18n/siteLocalePathUtils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type StudioLanguageOption = SiteLocaleConfig["languages"][number];

type LanguageContextValue = LanguagePathUtils & {
	/** Locale implied by the URL (when valid), otherwise the server-provided fallback. */
	currentLocale: string;
	/** Options for the language `<select>` (ids + labels). */
	languages: readonly StudioLanguageOption[];
	/** Ids + default for `pickLocalizedString` / Portable Text resolution on the client. */
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
	/** Navigate to the same logical path in another locale. */
	setLocale: (next: string) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
	children: ReactNode;
	/** Server / proxy locale — used when the pathname does not imply a known locale. */
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

	const currentLocale = useMemo(() => {
		const fromPath = pathUtils.localeFromPathname(pathname);
		return pathUtils.isAppLocale(fromPath) ? fromPath : locale;
	}, [pathname, locale, pathUtils]);

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
			currentLocale,
			languages: siteLocaleConfig.languages,
			siteLocale: {
				localeIds: siteLocaleConfig.localeIds,
				defaultLocale: siteLocaleConfig.defaultLocale,
			},
			setLocale,
		}),
		[currentLocale, pathUtils, setLocale, siteLocaleConfig],
	);

	useEffect(() => {
		document.documentElement.lang = currentLocale;
	}, [currentLocale]);

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
