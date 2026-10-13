/**
 * Resolve a human-readable label for a Sanity `link` object (Nav, Portable Text).
 *
 * `link.title` is now an `internationalizedArrayString` (per-locale entries). For internal
 * links we fall back to the referenced document title (also localized). External links fall
 * back to the URL, function links to the function key — both as a last resort before the
 * literal "Link" placeholder.
 *
 * Plain `string` is accepted on both fields for forward-compat with the document-level i18n
 * variant (one document per language → `reference->title` is a plain string).
 */

import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import type { IntlStringEntry } from "./sanityLocalizedText";
import { pickLocalizedString } from "./sanityLocalizedText";

type SiteLocaleSlice = Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;

type LocalizableLabel = IntlStringEntry[] | string | null | undefined;

function trimToUndefined(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function pickLabel(
	value: LocalizableLabel,
	locale: string | undefined,
	siteLocale: SiteLocaleSlice | null | undefined,
): string | undefined {
	if (Array.isArray(value)) {
		return trimToUndefined(pickLocalizedString(value, locale, siteLocale));
	}
	if (typeof value === "string") {
		return trimToUndefined(value);
	}
	return undefined;
}

export type ResolveLinkLabelInput = {
	linkTitle?: LocalizableLabel;
	referenceTitle?: LocalizableLabel;
	externalUrl?: string | null;
	functionKey?: string | null;
	locale?: string;
	siteLocale?: SiteLocaleSlice | null;
	/** Last-resort literal when no other source produced a usable label. */
	literalFallback?: string;
};

/**
 * Order: explicit link title → referenced document title → external URL → function key → fallback.
 */
export function resolveLinkLabel({
	linkTitle,
	referenceTitle,
	externalUrl,
	functionKey,
	locale,
	siteLocale,
	literalFallback = "Link",
}: ResolveLinkLabelInput): string {
	return (
		pickLabel(linkTitle, locale, siteLocale) ??
		pickLabel(referenceTitle, locale, siteLocale) ??
		trimToUndefined(externalUrl ?? undefined) ??
		trimToUndefined(functionKey ?? undefined) ??
		literalFallback
	);
}
