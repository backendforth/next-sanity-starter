/**
 * Resolves a `link` (`linkQuery`) into anchor props: rich-text link marks, nav rows
 * (`src/utils/navHref.ts`) and the cookie banner's policy link. Internal targets carry their
 * `path` from GROQ (`routePathProjection`) and get the locale prefix (`hrefFor`).
 */

import { type StegaBranded, stegaClean } from "next-sanity";

import type { SiteChromeQueryResult } from "@/sanity/sanity.types.gen";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

import { plainText } from "./sanityLocalizedText";
import { isStegaVariant } from "./stegaVariant";

/** The active locale plus the config that decides whether it gets a path prefix. */
export type LinkLocaleOptions = {
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
};

/** The `linkQuery` projection, typed from a footer row (a rich-text mark adds the raw fields). */
type LinkFields = NonNullable<
	NonNullable<SiteChromeQueryResult["nav"]>["footerMenu"]
>[number] extends infer T
	? T extends unknown
		? Omit<T, "_key">
		: never
	: never;

/**
 * A `linkQuery` projection: a Portable Text `link` mark, a nav row, or a single `link` field such
 * as the cookie banner's policy link (its `_key` is `null`); stega-branded outside rich text.
 */
export type LinkValue = LinkFields | StegaBranded<LinkFields>;

type ResolvedLink =
	| {
			kind: "anchor";
			href: string;
			/** A route of this site: render with `next/link`. */
			internal?: true;
			target?: "_blank";
			rel?: "noopener noreferrer";
	  }
	| { kind: "cookie-preferences" }
	| null;

/**
 * Resolve a `link` into a payload the renderer can spread onto an anchor
 * (`{ kind: "anchor", href, internal?, target?, rel? }`), the cookie-preferences action, or
 * `null` when it cannot be resolved (rendered as plain text, or no nav row).
 */
export function resolveLinkMark(
	mark: LinkValue | null | undefined,
	{ locale, siteLocale }: LinkLocaleOptions,
): ResolvedLink {
	if (!mark) return null;

	if (isStegaVariant(mark, "linkType", "linkExternal")) {
		const href = plainText(mark.url);
		if (!href) return null;
		const blank = mark.blank !== false;
		return {
			kind: "anchor",
			href,
			target: blank ? "_blank" : undefined,
			rel: blank ? "noopener noreferrer" : undefined,
		};
	}

	if (isStegaVariant(mark, "linkType", "linkInternal")) {
		/* `path` is `null` for a deleted or unpublished target. */
		const href = createLanguagePathUtils(siteLocale).hrefFor(
			mark.resolvedReference?.path,
			locale,
		);
		return href ? { kind: "anchor", href, internal: true } : null;
	}

	/* `open-cookie-preferences` is the only function; cleaned, because Presentation
	 * stega-encodes the key. */
	if (
		isStegaVariant(mark, "linkType", "linkFunction") &&
		stegaClean(mark.func?.key) === "open-cookie-preferences"
	) {
		return { kind: "cookie-preferences" };
	}

	return null;
}
