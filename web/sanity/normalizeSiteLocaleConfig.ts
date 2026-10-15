import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { FALLBACK_SITE_LOCALE_CONFIG } from "@/src/i18n/fallbackSiteLocales";

import type { SiteLanguageSettings } from "./types";

/**
 * Turns the `siteLanguageSettings` singleton into routing config. Only an empty
 * (or absent) language list falls back to `FALLBACK_SITE_LOCALE_CONFIG`; an
 * incomplete row or a stale default degrades locally instead of collapsing the
 * site to the single fallback locale. Row rules match the Studio's language
 * loader in `studio/config/sync/` — keep in sync.
 */
export function normalizeSiteLocaleConfig(
	raw: SiteLanguageSettings | null | undefined,
): SiteLocaleConfig {
	const rows = Array.isArray(raw?.availableLanguages)
		? raw.availableLanguages
		: [];
	const languages = rows
		.map((row) => {
			const id = typeof row?.id === "string" ? row.id.trim() : "";
			const title = typeof row?.title === "string" ? row.title.trim() : "";
			/* A row without a Label falls back to its id rather than dropping the locale. */
			return { id, title: title || id };
		})
		/* First occurrence wins: the schema doesn't enforce unique ids. */
		.filter(
			(row, index, all) =>
				row.id.length > 0 && all.findIndex((r) => r.id === row.id) === index,
		);

	const first = languages[0];
	if (!first) {
		return {
			localeIds: [...FALLBACK_SITE_LOCALE_CONFIG.localeIds],
			defaultLocale: FALLBACK_SITE_LOCALE_CONFIG.defaultLocale,
			languages: [...FALLBACK_SITE_LOCALE_CONFIG.languages],
		};
	}

	const defaultId =
		typeof raw?.defaultLanguageId === "string"
			? raw.defaultLanguageId.trim()
			: "";

	return {
		localeIds: languages.map((l) => l.id),
		/* A missing or stale default degrades to the first configured language. */
		defaultLocale: languages.some((l) => l.id === defaultId)
			? defaultId
			: first.id,
		languages,
	};
}
