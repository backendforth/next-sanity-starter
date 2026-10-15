/**
 * Resolves `sanity-plugin-internationalized-array` fields for a requested locale.
 * Fallback order: exact language tag → base tag → other configured site locales → any entry with content.
 * Pass `siteLocale` from `fetchSiteLanguageSettings()` when resolving; otherwise the built-in `en` fallback is used.
 *
 * The resolvers are generic over the entry's `value`, so the generated query types pass
 * straight through and come back typed: a string field yields `string`, a rich-text body its
 * own block union (embedded modules included, untouched — they resolve their own fields).
 */
import type { TypedObject } from "@portabletext/types";
import { stegaClean } from "next-sanity";

import {
	FALLBACK_SITE_LOCALE_CONFIG,
	type SiteLocaleConfig,
} from "@/src/i18n/fallbackSiteLocales";

type SiteLocaleSlice = Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;

/** One `internationalizedArray*` entry; the generated types have this shape. */
export type LocalizedEntry<V> = {
	_key?: string;
	language?: string | null;
	value?: V | null;
};

function effectiveSiteLocale(
	siteLocale?: SiteLocaleSlice | null,
): SiteLocaleSlice {
	if (
		siteLocale &&
		siteLocale.localeIds.length > 0 &&
		siteLocale.defaultLocale.trim()
	) {
		return siteLocale;
	}
	return {
		localeIds: FALLBACK_SITE_LOCALE_CONFIG.localeIds,
		defaultLocale: FALLBACK_SITE_LOCALE_CONFIG.defaultLocale,
	};
}

/** `de-AT` → `["de-AT", "de"]`. */
function getLocaleCandidates(locale: string): string[] {
	const normalized = locale.trim();
	if (!normalized) {
		return [];
	}
	const base = normalized.split("-")[0];
	if (base && base !== normalized) {
		return [normalized, base];
	}
	return [normalized];
}

function getLocaleFallbackChain(
	locale: string,
	site: SiteLocaleSlice,
): string[] {
	const normalized = locale.trim();
	const base = normalized.split("-")[0] || site.defaultLocale;
	const chain: string[] = [];
	if (normalized && normalized !== base) {
		chain.push(normalized);
	}
	if (!chain.includes(base)) {
		chain.push(base);
	}
	for (const siteLocaleId of site.localeIds) {
		if (siteLocaleId !== base && !chain.includes(siteLocaleId)) {
			chain.push(siteLocaleId);
		}
	}
	return chain;
}

/**
 * Blank strings and empty arrays count as missing, so the fallback chain moves on. Strings are
 * cleaned first: in Presentation a blank value still carries (non-whitespace) stega markers.
 */
function hasContent(value: unknown): boolean {
	if (typeof value === "string") return stegaClean(value).trim().length > 0;
	if (Array.isArray(value)) return value.length > 0;
	return value != null;
}

type Entries = ReadonlyArray<LocalizedEntry<unknown>> | null | undefined;
/** The value type of an entry array — for a union of arrays (clean and stega-branded query results), the union of their values. */
type EntryValue<T extends Entries> = NonNullable<
	NonNullable<T>[number]["value"]
>;

/**
 * The entry for `locale`, following the fallback chain; `undefined` when no entry has content.
 * So does a plain string stored before its field became i18n (until the migration has run),
 * instead of throwing.
 */
export function pickLocalizedValue<T extends Entries>(
	entries: T,
	locale?: string,
	siteLocale?: SiteLocaleSlice | null,
): EntryValue<T> | undefined {
	if (typeof entries === "string" || !entries?.length) {
		return undefined;
	}
	const site = effectiveSiteLocale(siteLocale);
	const requested =
		locale?.trim() ||
		site.defaultLocale ||
		FALLBACK_SITE_LOCALE_CONFIG.defaultLocale;
	for (const segment of getLocaleFallbackChain(requested, site)) {
		for (const candidate of getLocaleCandidates(segment)) {
			const match = entries.find(
				(entry) =>
					(entry.language === candidate || entry._key === candidate) &&
					hasContent(entry.value),
			);
			if (match) {
				return (match.value ?? undefined) as EntryValue<T> | undefined;
			}
		}
	}
	return (entries.find((entry) => hasContent(entry.value))?.value ??
		undefined) as EntryValue<T> | undefined;
}

/** i18n string fields (`internationalizedArrayString`), trimmed. */
export function pickLocalizedString(
	entries: ReadonlyArray<LocalizedEntry<string>> | null | undefined,
	locale?: string,
	siteLocale?: SiteLocaleSlice | null,
): string | undefined {
	return pickLocalizedValue(entries, locale, siteLocale)?.trim() || undefined;
}

/** `internationalizedArrayRichText*` bodies — the blocks for `locale`, `[]` when there are none. */
export function pickLocalizedPortableTextBlocks<
	T extends ReadonlyArray<LocalizedEntry<TypedObject[]>> | null | undefined,
>(
	entries: T,
	locale: string,
	siteLocale?: SiteLocaleSlice | null,
): EntryValue<T>[number][] {
	return pickLocalizedValue(entries, locale, siteLocale) ?? [];
}
