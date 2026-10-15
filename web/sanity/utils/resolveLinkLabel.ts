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
import { isStegaVariant } from "./stegaVariant";

/** A title: a plain string, or localized entries on a main-shaped target. */
function pickTitle(
	value: ReadonlyArray<LocalizedEntry<string>> | string | null | undefined,
	{ locale, siteLocale }: LinkLocaleOptions,
): string | undefined {
	return typeof value === "string"
		? plainText(value)
		: pickLocalizedString(value, locale, siteLocale);
}

/** What a link points at, as a label: the internal target's title, the URL or the function key. */
function targetLabel(
	link: LinkValue,
	options: LinkLocaleOptions,
): string | undefined {
	if (isStegaVariant(link, "linkType", "linkInternal")) {
		return pickTitle(link.resolvedReference?.title, options);
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
		(link && (pickTitle(link.title, options) ?? targetLabel(link, options))) ??
		literalFallback ??
		uiLabel("link", options.locale)
	);
}
