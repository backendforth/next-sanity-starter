/**
 * Resolve a human-readable label for a Sanity `link` object (Nav, Portable Text). Internal links
 * fall back to the referenced document's title, external links to the URL, function links to
 * the function key — all before the localized "Link" label.
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
	| null
	| undefined;

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
		pickLocalizedString(linkTitle, locale, siteLocale) ??
		pickLocalizedString(referenceTitle, locale, siteLocale) ??
		plainText(externalUrl) ??
		plainText(functionKey) ??
		literalFallback ??
		uiLabel("link", locale ?? FALLBACK_SITE_LOCALE_CONFIG.defaultLocale)
	);
}
