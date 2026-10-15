/**
 * Resolve a human-readable label for a Sanity `link` object (Nav, Portable Text). Internal links
 * fall back to the referenced document's title, external links to the URL, function links to
 * the function key — all before the localized "Link" label.
 *
 * On this branch both titles are plain strings in the document's language. Localized entry
 * arrays are still accepted: a dataset shared with `main` holds main-shaped documents (e.g. a
 * `home` whose title is an `internationalizedArrayString`), and a link can point at one.
 */

import {
	FALLBACK_SITE_LOCALE_CONFIG,
	type SiteLocaleConfig,
} from "@/src/i18n/fallbackSiteLocales";
import { uiLabel } from "@/src/i18n/uiLabels";
import {
	type LocalizedEntry,
	pickLocalizedString,
	plainText,
} from "./sanityLocalizedText";

type SiteLocaleSlice = Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;

type LocalizableLabel =
	| ReadonlyArray<LocalizedEntry<string>>
	| string
	| null
	| undefined;

function pickLabel(
	value: LocalizableLabel,
	locale: string | undefined,
	siteLocale: SiteLocaleSlice | null | undefined,
): string | undefined {
	return typeof value === "string"
		? plainText(value)
		: pickLocalizedString(value, locale, siteLocale);
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
		plainText(externalUrl) ??
		plainText(functionKey) ??
		literalFallback ??
		uiLabel("link", locale ?? FALLBACK_SITE_LOCALE_CONFIG.defaultLocale)
	);
}
