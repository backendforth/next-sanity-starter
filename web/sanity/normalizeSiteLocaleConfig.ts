import { normalizeSiteLanguages } from "@repo/site-languages";

import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import type { SiteLanguageSettings } from "./types";

/**
 * Turns the `siteLanguageSettings` singleton into routing config. The languages follow the row
 * rules shared with the Studio (`@repo/site-languages`): only an empty or absent list falls back
 * to `FALLBACK_SITE_LOCALE_CONFIG`. A missing or stale default degrades to the first language.
 */
export function normalizeSiteLocaleConfig(
	raw: SiteLanguageSettings | null | undefined,
): SiteLocaleConfig {
	const languages = normalizeSiteLanguages(raw);
	const defaultId = raw?.defaultLanguageId?.trim() ?? "";
	return {
		localeIds: languages.map((l) => l.id),
		defaultLocale: languages.some((l) => l.id === defaultId)
			? defaultId
			: languages[0].id,
		languages,
	};
}
