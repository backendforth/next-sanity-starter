import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import {
	type IntlStringEntry,
	pickLocalizedString,
} from "./sanityLocalizedText";

type SiteLocaleSlice = Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;

function localizedOrPlainTitle(
	value: IntlStringEntry[] | string | null | undefined,
	locale: string,
	siteLocale?: SiteLocaleSlice | null,
): string | undefined {
	if (typeof value === "string") {
		const t = value.trim();
		return t.length > 0 ? t : undefined;
	}
	return pickLocalizedString(value, locale, siteLocale);
}

export type ResolveLinkLabelInput = {
	/** Link override (`internationalizedArrayString` or legacy plain string). */
	linkTitle?: IntlStringEntry[] | string | null;
	/** Referenced document title (i18n array or plain string on document-level variant). */
	referenceTitle?: IntlStringEntry[] | string | null;
	locale: string;
	siteLocale?: SiteLocaleSlice | null;
	/** External URL when link title is empty. */
	externalUrl?: string | null;
	literalFallback?: string;
};

/**
 * Nav / link label: localized link title, then referenced page title, then URL or fallback.
 */
export function resolveLinkLabel({
	linkTitle,
	referenceTitle,
	locale,
	siteLocale,
	externalUrl,
	literalFallback = "Link",
}: ResolveLinkLabelInput): string {
	const override = localizedOrPlainTitle(linkTitle, locale, siteLocale);
	if (override) return override;

	const ref = localizedOrPlainTitle(referenceTitle, locale, siteLocale);
	if (ref) return ref;

	const url = typeof externalUrl === "string" ? externalUrl.trim() : "";
	if (url.length > 0) return url;

	return literalFallback;
}
