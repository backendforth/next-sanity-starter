/**
 * Resolves `sanity-plugin-internationalized-array` fields for a requested locale.
 * Fallback order: exact language tag → base tag → other configured locales (`locales` in
 * `@/src/i18n/site-locales.ts`) → any entry with content. Routing passes
 * `locale` from `params` (see `proxy.ts`); keep all of that here — no second i18n layer.
 */
import type { PortableTextBlock } from "@portabletext/types";

import { defaultLocale, locales } from "@/src/i18n/config";

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

/** Any entry with content (last resort if no `locales` match). */
function pickFallbackEntry(
	entries: IntlTextEntry[],
): IntlTextEntry | undefined {
	return entries.find((entry) => hasUsableValue(entry.value));
}

/**
 * Order: exact tag (e.g. `de-DE`), base language, then other entries in `locales` (from `site-locales.ts`), then any remaining entry.
 */
function getLocaleFallbackChain(locale: string): string[] {
	const normalized = locale.trim();
	const base = normalized.split("-")[0] || defaultLocale;
	const chain: string[] = [];
	if (normalized && normalized !== base) {
		chain.push(normalized);
	}
	if (!chain.includes(base)) {
		chain.push(base);
	}
	for (const siteLocale of locales) {
		if (siteLocale !== base && !chain.includes(siteLocale)) {
			chain.push(siteLocale);
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
): string | PortableTextBlock[] | undefined {
	if (!Array.isArray(entries) || entries.length === 0) {
		return undefined;
	}

	for (const localeSegment of getLocaleFallbackChain(locale)) {
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

/**
 * Walks objects and arrays recursively and resolves nested `internationalizedArray*` fields
 * (e.g. `module.text` in rich text, links with localized objects) so the result matches
 * the single-locale chain `rich text → blocks → …`.
 */
function deepResolveLocalizedTree(value: unknown, locale: string): unknown {
	if (value == null) {
		return value;
	}

	if (looksLikeIntlEntryArray(value)) {
		const resolved = resolveLocalizedEntries(value, locale);
		if (resolved === undefined) {
			return undefined;
		}
		if (typeof resolved === "string") {
			return resolved;
		}
		if (Array.isArray(resolved)) {
			return resolved.map((item) => deepResolveLocalizedTree(item, locale));
		}
		return resolved;
	}

	if (Array.isArray(value)) {
		return value.map((item) => deepResolveLocalizedTree(item, locale));
	}

	if (typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const [propertyKey, propertyValue] of Object.entries(
			value as object,
		)) {
			out[propertyKey] = deepResolveLocalizedTree(propertyValue, locale);
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
): PortableTextBlock[] {
	const raw = resolveLocalizedEntries(entries, locale);
	if (!Array.isArray(raw) || raw.length === 0) {
		return [];
	}
	return deepResolveLocalizedTree(raw, locale) as PortableTextBlock[];
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
	locale = "en",
	as = "auto",
}: ParseLocalizedTextOptions):
	| string
	| PortableTextBlock[]
	| undefined
	| PortableTextBlock[] {
	const raw = resolveLocalizedEntries(entries, locale);

	if (as === "string") {
		return typeof raw === "string" ? raw : undefined;
	}

	if (as === "blocks") {
		if (!Array.isArray(raw) || raw.length === 0) {
			return [];
		}
		return deepResolveLocalizedTree(raw, locale) as PortableTextBlock[];
	}

	if (typeof raw === "string") {
		return raw;
	}
	if (Array.isArray(raw) && raw.length > 0) {
		return deepResolveLocalizedTree(raw, locale) as PortableTextBlock[];
	}
	return raw;
}

/** Convenience for i18n string fields (`internationalizedArrayString`). */
export function pickLocalizedString(
	entries: IntlStringEntry[] | null | undefined,
	locale: string = defaultLocale,
): string | undefined {
	return parseLocalizedText({ entries, locale, as: "string" });
}

/** Convenience for `internationalizedArrayRichText*` / `richTextMedia` bodies. */
export function pickLocalizedPortableTextBlocks(
	entries: IntlRichTextEntry[] | null | undefined,
	locale: string,
): PortableTextBlock[] {
	return resolveLocalizedPortableTextDeep(entries, locale);
}
