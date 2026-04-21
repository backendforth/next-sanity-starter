"use client";

import { studioLanguages } from "@repo/languages";
import { usePathname, useRouter } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
} from "react";

import type { AppLocale } from "@/src/i18n/config";
import {
	localeFromPathname,
	localePath,
	pathWithoutLocalePrefix,
} from "@/src/i18n/paths";

// ─── Types ───────────────────────────────────────────────────────────────────

export type StudioLanguageOption = (typeof studioLanguages)[number];

type LanguageContextValue = {
	/** Locale implied by the URL (when valid), otherwise the server-provided fallback. */
	currentLocale: AppLocale;
	/** Options for the language `<select>` (ids + labels). */
	languages: readonly StudioLanguageOption[];
	/** Navigate to the same logical path in another locale. */
	setLocale: (next: AppLocale) => void;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
	children: ReactNode;
	/** Server / middleware locale — used when the pathname does not imply a known locale. */
	locale: AppLocale;
};

export function LanguageProvider({ children, locale }: LanguageProviderProps) {
	const pathname = usePathname() ?? "/";
	const router = useRouter();

	const currentLocale = useMemo(() => {
		const fromPath = localeFromPathname(pathname);
		return studioLanguages.some((l) => l.id === fromPath) ? fromPath : locale;
	}, [pathname, locale]);

	const pathWithoutLocale = useMemo(
		() => pathWithoutLocalePrefix(pathname),
		[pathname],
	);

	const setLocale = useCallback(
		(next: AppLocale) => {
			router.push(localePath(pathWithoutLocale, next));
		},
		[pathWithoutLocale, router],
	);

	const value = useMemo<LanguageContextValue>(
		() => ({
			currentLocale,
			languages: studioLanguages,
			setLocale,
		}),
		[currentLocale, setLocale],
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
