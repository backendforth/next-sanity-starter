import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { FALLBACK_SITE_LOCALE_CONFIG } from "@/src/i18n/fallbackSiteLocales";

import type { SiteLanguageSettingsDocument } from "./types/siteLanguageSettings";

export function normalizeSiteLocaleConfig(
	raw: SiteLanguageSettingsDocument | null | undefined,
): SiteLocaleConfig {
	const rows = Array.isArray(raw?.availableLanguages)
		? raw.availableLanguages
		: [];
	const languages = rows
		.map((row) => ({
			id: typeof row?.id === "string" ? row.id.trim() : "",
			title: typeof row?.title === "string" ? row.title.trim() : "",
		}))
		.filter((row) => row.id.length > 0 && row.title.length > 0);

	const defaultId =
		typeof raw?.defaultLanguageId === "string"
			? raw.defaultLanguageId.trim()
			: "";

	if (
		languages.length === 0 ||
		!defaultId ||
		!languages.some((l) => l.id === defaultId)
	) {
		return {
			localeIds: [...FALLBACK_SITE_LOCALE_CONFIG.localeIds],
			defaultLocale: FALLBACK_SITE_LOCALE_CONFIG.defaultLocale,
			languages: [...FALLBACK_SITE_LOCALE_CONFIG.languages],
		};
	}

	return {
		localeIds: languages.map((l) => l.id),
		defaultLocale: defaultId,
		languages,
	};
}
