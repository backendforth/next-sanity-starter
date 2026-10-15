/**
 * Resolve a human-readable label for a Sanity `link` object (Nav, Portable Text).
 *
 * On this branch (document-level i18n) `link.title` and the referenced document's title are
 * plain strings in the document's language. For internal links we fall back to the referenced
 * document title. External links fall back to the URL, function links to the function key —
 * both as a last resort before the localized "Link" label.
 *
 * Localized entry arrays are still accepted on both fields and resolved with `pickLocalizedString`:
 * a dataset shared with `main` holds main-shaped documents (e.g. a `home` whose title is an
 * `internationalizedArrayString`), and a link on this branch can point at one.
 */

import {
	FALLBACK_SITE_LOCALE_CONFIG,
	type SiteLocaleConfig,
} from "@/src/i18n/fallbackSiteLocales";
import { uiLabel } from "@/src/i18n/uiLabels";
import {
	type LocalizedEntry,
	pickLocalizedString,
} from "./sanityLocalizedText";

type SiteLocaleSlice = Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;

type LocalizableLabel =
	| ReadonlyArray<LocalizedEntry<string>>
	| string
	| null
	| undefined;

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

type ResolveLinkLabelInput = {
	linkTitle?: LocalizableLabel;
	referenceTitle?: LocalizableLabel;
	externalUrl?: string | null;
	functionKey?: string | null;
	locale?: string;
	siteLocale?: SiteLocaleSlice | null;
	/** Last resort when no other source produced a usable label; default: the UI "Link" label. */
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
	literalFallback,
}: ResolveLinkLabelInput): string {
	return (
		pickLabel(linkTitle, locale, siteLocale) ??
		pickLabel(referenceTitle, locale, siteLocale) ??
		trimToUndefined(externalUrl ?? undefined) ??
		trimToUndefined(functionKey ?? undefined) ??
		literalFallback ??
		uiLabel("link", locale ?? FALLBACK_SITE_LOCALE_CONFIG.defaultLocale)
	);
}
