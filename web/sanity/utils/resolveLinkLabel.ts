/**
 * The label of a `link` (`linkQuery`) that no text labels: nav rows and the cookie banner's
 * policy link. A rich-text link's label is its marked text.
 */

import { uiLabel } from "@/src/i18n/uiLabels";

import type { LinkLocaleOptions, LinkValue } from "./linkResolver";
import { pickLocalizedString, plainText } from "./sanityLocalizedText";

/**
 * Order: the link's title → what it points at (an internal target's title, the URL, the function
 * key) → `literalFallback` → the UI "Link" label.
 */
export function resolveLinkLabel(
	link: LinkValue | null | undefined,
	{ locale, siteLocale }: LinkLocaleOptions,
	literalFallback?: string,
): string {
	const pick = (entries: Parameters<typeof pickLocalizedString>[0]) =>
		pickLocalizedString(entries, locale, siteLocale);
	return (
		pick(link?.title) ??
		(link && "resolvedReference" in link
			? pick(link.resolvedReference?.title)
			: undefined) ??
		(link && "url" in link ? plainText(link.url) : undefined) ??
		(link && "func" in link ? plainText(link.func?.key) : undefined) ??
		literalFallback ??
		uiLabel("link", locale)
	);
}
