"use client";

import { usePathname, useRouter } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
} from "react";

import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import {
	createLanguagePathUtils,
	type LanguagePathUtils,
	type TranslationPath,
	translationPathsByLocale,
} from "@/src/i18n/siteLocalePathUtils";

// ─── Types ───────────────────────────────────────────────────────────────────

type StudioLanguageOption = SiteLocaleConfig["languages"][number];

type LanguageContextValue = LanguagePathUtils & {
	/** Locale implied by the URL (when valid), otherwise the server-provided fallback. */
	currentLocale: string;
	/** Options for the language `<select>` (ids + labels). */
	languages: readonly StudioLanguageOption[];
	/** Ids + default for `pickLocalizedString` / Portable Text resolution on the client. */
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
	/**
	 * Navigate to the current document in another locale — its registered
	 * translation, else that locale's home. Routes that register nothing
	 * keep the path and swap the prefix.
	 */
	setLocale: (next: string) => void;
	/** Called by `LocaleAlternates` with the language variants of the page at `pathname`. */
	setTranslations: (
		pathname: string,
		translations: readonly TranslationPath[],
	) => void;
};

/** Locale → prefixed path of the document rendered at `pathname`. */
type RegisteredTranslations = {
	pathname: string;
	byLocale: Readonly<Record<string, string>>;
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

	/* Slugs differ per language under document-level translation, so the
	 * prefix swap only holds for routes that don't register their variants.
	 * Keyed by pathname: an entry left behind by the previous page is ignored.
	 * A ref, not state — it is only read on click, so registering must not
	 * re-render every `useLanguage` consumer. */
	const registeredRef = useRef<RegisteredTranslations | null>(null);

	const setTranslations = useCallback(
		(forPathname: string, translations: readonly TranslationPath[]) => {
			registeredRef.current = {
				pathname: forPathname,
				byLocale: translationPathsByLocale(translations, pathUtils),
			};
		},
		[pathUtils],
	);

	const setLocale = useCallback(
		(next: string) => {
			if (!pathUtils.isAppLocale(next)) {
				return;
			}
			const registered = registeredRef.current;
			if (registered?.pathname === pathname) {
				router.push(
					registered.byLocale[next] ?? pathUtils.localePath("/", next),
				);
				return;
			}
			router.push(pathUtils.localePath(pathWithoutLocale, next));
		},
		[pathname, pathWithoutLocale, pathUtils, router],
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
			setTranslations,
		}),
		[currentLocale, pathUtils, setLocale, setTranslations, siteLocaleConfig],
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

/** `useLanguage()` for shared components that may render outside a `LanguageProvider`. */
export function useOptionalLanguage() {
	return useContext(LanguageContext);
}
