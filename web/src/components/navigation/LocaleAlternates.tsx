"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useLanguage } from "@/src/contexts/LanguageContext";
import type { TranslationPath } from "@/src/i18n/siteLocalePathUtils";

type LocaleAlternatesProps = {
	/** Route locale of the rendered document. */
	locale: string;
	/** Its path without the locale prefix (`/`, `/about`, `/work/x`). */
	path: string;
	/** Its published language variants (`translationsQuery`). */
	translations?: readonly TranslationPath[] | null;
};

/**
 * Tells `LanguageSwitch` where the rendered document lives in every other
 * language, so switching from `/about` lands on `/de/ueber-uns` instead of
 * a 404 at `/de/about`. Render it once per route page; it renders nothing.
 * The document itself always counts, so a page without linked translations
 * sends the switch to the other locale's home.
 */
export function LocaleAlternates({
	locale,
	path,
	translations,
}: LocaleAlternatesProps) {
	const pathname = usePathname() ?? "/";
	const { setTranslations } = useLanguage();

	useEffect(() => {
		setTranslations(pathname, [
			{ language: locale, path },
			...(translations ?? []),
		]);
	}, [locale, path, pathname, setTranslations, translations]);

	return null;
}
