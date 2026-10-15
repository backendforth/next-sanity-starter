/**
 * The site's languages as the Studio (language tabs) and the web (routing, translation fallback
 * order) both read them from the `siteLanguageSettings` singleton: the projection, the row
 * rules and the fallback for a missing or empty document. The web adds the default language
 * (`web/sanity/normalizeSiteLocaleConfig.ts`); the Studio ignores it.
 */

export type SiteLanguage = { id: string; title: string };

/** At least one language: the fallback guarantees it. */
export type SiteLanguages = [SiteLanguage, ...SiteLanguage[]];

/** Used when `siteLanguageSettings` is missing or lists no usable language. */
export const FALLBACK_SITE_LANGUAGES: Readonly<SiteLanguages> = [
	{ id: "en", title: "English" },
];

/** Projection on the `siteLanguageSettings` document that `normalizeSiteLanguages` reads. */
export const SITE_LANGUAGES_PROJECTION = `{
  availableLanguages[]{id, title},
  defaultLanguageId
}`;

/** The published singleton (the Studio reads its draft first, with the same projection). */
export const SITE_LANGUAGE_SETTINGS_QUERY = `*[_type == "siteLanguageSettings" && _id == "siteLanguageSettings"][0]${SITE_LANGUAGES_PROJECTION}`;

type LanguageRow = { id?: string | null; title?: string | null } | null;

/** The projected document, as a GROQ result or an unvalidated draft delivers it. */
export type SiteLanguagesDocument =
	| {
			availableLanguages?: readonly LanguageRow[] | null;
			defaultLanguageId?: string | null;
	  }
	| null
	| undefined;

/**
 * The configured languages in order. Only the id is required, so an incomplete row degrades
 * instead of collapsing the site to the fallback: a row without a label shows its id. A
 * repeated id keeps its first row — validation rejects duplicates, but drafts are unvalidated.
 */
export function normalizeSiteLanguages(
	doc: SiteLanguagesDocument,
): SiteLanguages {
	const rows = Array.isArray(doc?.availableLanguages)
		? doc.availableLanguages
		: [];
	const seen = new Set<string>();
	const languages: SiteLanguage[] = [];
	for (const row of rows) {
		const id = typeof row?.id === "string" ? row.id.trim() : "";
		if (!id || seen.has(id)) continue;
		seen.add(id);
		const title = typeof row?.title === "string" ? row.title.trim() : "";
		languages.push({ id, title: title || id });
	}
	const [first, ...rest] = languages;
	return first ? [first, ...rest] : [...FALLBACK_SITE_LANGUAGES];
}
