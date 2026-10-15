/**
 * The label of a `link` (`linkQuery`) that no text labels: nav rows and the cookie banner's
 * policy link. A rich-text link's label is its marked text.
 *
 * On this branch both titles are plain strings in the document's language. Localized entry
 * arrays are still accepted: a dataset shared with `main` holds main-shaped documents (e.g. a
 * `home` whose title is an `internationalizedArrayString`), and a link can point at one.
 */

import { uiLabel } from "@/src/i18n/uiLabels";

import type { LinkLocaleOptions, LinkValue } from "./linkResolver";
import {
	type LocalizedEntry,
	pickLocalizedString,
	plainText,
} from "./sanityLocalizedText";

/**
 * Order: the link's title → what it points at (an internal target's title, the URL, the function
 * key) → `literalFallback` → the UI "Link" label.
 */
export function resolveLinkLabel(
	link: LinkValue | null | undefined,
	{ locale, siteLocale }: LinkLocaleOptions,
	literalFallback?: string,
): string {
	const pick = (
		value: ReadonlyArray<LocalizedEntry<string>> | string | null | undefined,
	) =>
		typeof value === "string"
			? plainText(value)
			: pickLocalizedString(value, locale, siteLocale);
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
