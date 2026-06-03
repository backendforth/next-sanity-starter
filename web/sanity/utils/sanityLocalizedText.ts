/**
 * Resolves `sanity-plugin-internationalized-array` fields for a requested locale.
 * Fallback order: exact language tag → base tag → other configured site locales → any entry with content.
 * Pass `siteLocale` from `fetchSiteLanguageSettings()` when resolving; otherwise built-in fallback (en/de) is used.
 */
import type { PortableTextBlock } from "@portabletext/types";

import {
	FALLBACK_SITE_LOCALE_CONFIG,
	type SiteLocaleConfig,
} from "@/src/i18n/fallbackSiteLocales";

type SiteLocaleSlice = Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;

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

type LocalizedEntryValue = string | PortableTextBlock[] | null | undefined;

type LocalizedEntryBase<TValue extends LocalizedEntryValue> = {
	_key?: string;
	language?: string;
	value?: TValue;
};

export type IntlStringEntry = LocalizedEntryBase<string | null>;
export type IntlRichTextEntry = LocalizedEntryBase<PortableTextBlock[] | null>;
export type IntlTextEntry = LocalizedEntryBase<LocalizedEntryValue>;

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

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyPortableText(value: unknown): value is PortableTextBlock[] {
	return Array.isArray(value) && value.length > 0;
}

function hasUsableValue(value: LocalizedEntryValue): boolean {
	return isNonEmptyString(value) || isNonEmptyPortableText(value);
}

function pickPreferredEntry(
	entries: IntlTextEntry[],
	localeCandidates: string[],
): IntlTextEntry | undefined {
	for (const candidateTag of localeCandidates) {
		const matched = entries.find(
			(entry) =>
				(entry.language === candidateTag || entry._key === candidateTag) &&
				hasUsableValue(entry.value),
		);
		if (matched) {
			return matched;
		}
	}
	return undefined;
}

/** Any entry with content (last resort if no configured locales match). */
function pickFallbackEntry(
	entries: IntlTextEntry[],
): IntlTextEntry | undefined {
	return entries.find((entry) => hasUsableValue(entry.value));
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

function coerceResolvedValue(
	value: LocalizedEntryValue,
): string | PortableTextBlock[] | undefined {
	if (isNonEmptyString(value)) {
		return value.trim();
	}
	if (isNonEmptyPortableText(value)) {
		return value;
	}
	return undefined;
}

function resolveLocalizedEntries(
	entries: IntlTextEntry[] | null | undefined,
	locale: string,
	site: SiteLocaleSlice,
): string | PortableTextBlock[] | undefined {
	if (!Array.isArray(entries) || entries.length === 0) {
		return undefined;
	}

	for (const localeSegment of getLocaleFallbackChain(locale, site)) {
		const candidates = getLocaleCandidates(localeSegment);
		const preferred = pickPreferredEntry(entries, candidates);
		if (preferred) {
			return coerceResolvedValue(preferred.value);
		}
	}

	const fallback = pickFallbackEntry(entries);
	return coerceResolvedValue(fallback?.value);
}

/**
 * Detects `sanity-plugin-internationalized-array` entries (`language` / `_key` + `value`).
 * Do not confuse with arbitrary object arrays: each element must have `value`.
 */
function looksLikeIntlEntryArray(value: unknown): value is IntlTextEntry[] {
	if (!Array.isArray(value) || value.length === 0) {
		return false;
	}
	return value.every(
		(item) =>
			item != null &&
			typeof item === "object" &&
			"value" in item &&
			("language" in item || "_key" in item),
	);
}

function deepResolveLocalizedTree(
	value: unknown,
	locale: string,
	site: SiteLocaleSlice,
): unknown {
	if (value == null) {
		return value;
	}

	if (looksLikeIntlEntryArray(value)) {
		const resolved = resolveLocalizedEntries(value, locale, site);
		if (resolved === undefined) {
			return undefined;
		}
		if (typeof resolved === "string") {
			return resolved;
		}
		if (Array.isArray(resolved)) {
			return resolved.map((item) =>
				deepResolveLocalizedTree(item, locale, site),
			);
		}
		return resolved;
	}

	if (Array.isArray(value)) {
		return value.map((item) => deepResolveLocalizedTree(item, locale, site));
	}

	if (typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const [propertyKey, propertyValue] of Object.entries(
			value as object,
		)) {
			out[propertyKey] = deepResolveLocalizedTree(propertyValue, locale, site);
		}
		return out;
	}

	return value;
}

/**
 * Picks the locale for `internationalizedArrayRichText*` and resolves all embedded i18n
 * fields in blocks, mark defs, and modules.
 */
export function resolveLocalizedPortableTextDeep(
	entries: IntlRichTextEntry[] | null | undefined,
	locale: string,
	siteLocale?: SiteLocaleSlice | null,
): PortableTextBlock[] {
	const site = effectiveSiteLocale(siteLocale);
	const raw = resolveLocalizedEntries(entries, locale, site);
	if (!Array.isArray(raw) || raw.length === 0) {
		return [];
	}
	return deepResolveLocalizedTree(raw, locale, site) as PortableTextBlock[];
}

export type ParseLocalizedTextOptions = {
	/** `internationalizedArray*` field value from Sanity */
	entries: IntlTextEntry[] | null | undefined;
	locale?: string;
	/**
	 * - `auto` (default): string or Portable Text blocks, depending on the field
	 * - `string`: only plain string (rich text resolves to `undefined`)
	 * - `blocks`: only blocks (plain string resolves to `[]`)
	 */
	as?: "auto" | "string" | "blocks";
	/** From `fetchSiteLanguageSettings()` — drives fallback order. */
	siteLocale?: SiteLocaleSlice | null;
};

export function parseLocalizedText(
	options: Omit<ParseLocalizedTextOptions, "as"> & { as?: "auto" },
): string | PortableTextBlock[] | undefined;
export function parseLocalizedText(
	options: ParseLocalizedTextOptions & { as: "string" },
): string | undefined;
export function parseLocalizedText(
	options: ParseLocalizedTextOptions & { as: "blocks" },
): PortableTextBlock[];
export function parseLocalizedText({
	entries,
	locale,
	as = "auto",
	siteLocale,
}: ParseLocalizedTextOptions):
	| string
	| PortableTextBlock[]
	| undefined
	| PortableTextBlock[] {
	const site = effectiveSiteLocale(siteLocale);
	const resolvedLocale =
		locale?.trim() ||
		site.defaultLocale ||
		FALLBACK_SITE_LOCALE_CONFIG.defaultLocale;
	const raw = resolveLocalizedEntries(entries, resolvedLocale, site);

	if (as === "string") {
		return typeof raw === "string" ? raw : undefined;
	}

	if (as === "blocks") {
		if (!Array.isArray(raw) || raw.length === 0) {
			return [];
		}
		return deepResolveLocalizedTree(
			raw,
			resolvedLocale,
			site,
		) as PortableTextBlock[];
	}

	if (typeof raw === "string") {
		return raw;
	}
	if (Array.isArray(raw) && raw.length > 0) {
		return deepResolveLocalizedTree(
			raw,
			resolvedLocale,
			site,
		) as PortableTextBlock[];
	}
	return raw;
}

/** Convenience for i18n string fields (`internationalizedArrayString`). */
export function pickLocalizedString(
	entries: IntlStringEntry[] | null | undefined,
	locale?: string,
	siteLocale?: SiteLocaleSlice | null,
): string | undefined {
	const site = effectiveSiteLocale(siteLocale);
	const loc =
		locale?.trim() ||
		site.defaultLocale ||
		FALLBACK_SITE_LOCALE_CONFIG.defaultLocale;
	return parseLocalizedText({ entries, locale: loc, as: "string", siteLocale });
}

/** Convenience for `internationalizedArrayRichText*` / `richTextMedia` bodies. */
export function pickLocalizedPortableTextBlocks(
	entries: IntlRichTextEntry[] | null | undefined,
	locale: string,
	siteLocale?: SiteLocaleSlice | null,
): PortableTextBlock[] {
	return resolveLocalizedPortableTextDeep(entries, locale, siteLocale);
}
