/**
 * The label of a `link` (`linkQuery`) that no text labels: nav rows and the cookie banner's
 * policy link. A rich-text link's label is its marked text.
 */

import { uiLabel } from "@/src/i18n/uiLabels";

import type { LinkLocaleOptions, LinkValue } from "./linkResolver";
import { pickLocalizedString, plainText } from "./sanityLocalizedText";
import { isStegaVariant } from "./stegaVariant";

/** What a link points at, as a label: the internal target's title, the URL or the function key. */
function targetLabel(
	link: LinkValue,
	{ locale, siteLocale }: LinkLocaleOptions,
): string | undefined {
	if (isStegaVariant(link, "linkType", "linkInternal")) {
		return pickLocalizedString(
			link.resolvedReference?.title,
			locale,
			siteLocale,
		);
	}
	if (isStegaVariant(link, "linkType", "linkExternal")) {
		return plainText(link.url);
	}
	if (isStegaVariant(link, "linkType", "linkFunction")) {
		return plainText(link.func?.key);
	}
	return undefined;
}

/** Order: the link's title → {@link targetLabel} → `literalFallback` → the UI "Link" label. */
export function resolveLinkLabel(
	link: LinkValue | null | undefined,
	options: LinkLocaleOptions,
	literalFallback?: string,
): string {
	return (
		(link &&
			(pickLocalizedString(link.title, options.locale, options.siteLocale) ??
				targetLabel(link, options))) ??
		literalFallback ??
		uiLabel("link", options.locale)
	);
}
