/**
 * Resolves a Portable Text `link` mark into anchor props. Internal targets carry their `path`
 * from GROQ (`routePathProjection`) and get the locale prefix (`hrefFor`). For nav rows see
 * `src/utils/navHref.ts`.
 */

import { type StegaBranded, stegaClean } from "next-sanity";

import type { LinkMark } from "@/sanity/types";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

import { isStegaVariant } from "./stegaVariant";

/** The active locale plus the config that decides whether it gets a path prefix. */
export type LinkLocaleOptions = {
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
};

type LinkFields = LinkMark extends infer T
	? T extends unknown
		? Omit<T, "_key">
		: never
	: never;

/**
 * A `linkQuery` projection: a Portable Text `link` mark, or a single `link` field such as the
 * cookie banner's policy link. The field has a `null` `_key` and, outside rich text, stega-branded
 * strings.
 */
type LinkValue = LinkFields | StegaBranded<LinkFields>;

export type ResolvedLink =
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
 * A `function` link's target, shared by rich text and nav: `scroll-to` is an anchor to its id,
 * `open-cookie-preferences` a button. `null` for a scroll-to without id or an unknown key.
 * Cleaned: in Presentation stega markers would end up in the hash and match no id.
 */
export function resolveFunctionLink(
	key: string | null | undefined,
	params: string | null | undefined,
): ResolvedLink {
	const action = stegaClean(key);
	if (action === "open-cookie-preferences")
		return { kind: "cookie-preferences" };
	if (action !== "scroll-to") return null;
	const anchor = stegaClean(params)?.trim();
	if (!anchor) return null;
	return {
		kind: "anchor",
		href: anchor.startsWith("#") ? anchor : `#${anchor}`,
	};
}

/**
 * Resolve a Portable Text `link` mark into a payload the renderer can spread onto an anchor
 * (`{ kind: "anchor", href, internal?, target?, rel? }`), the cookie-preferences action, or
 * `null` when the mark cannot be resolved (rendered as plain text).
 */
export function resolveLinkMark(
	mark: LinkValue | null | undefined,
	{ locale, siteLocale }: LinkLocaleOptions,
): ResolvedLink {
	if (!mark) return null;

	if (isStegaVariant(mark, "linkType", "linkExternal")) {
		if (!mark.url) return null;
		const blank = mark.blank !== false;
		return {
			kind: "anchor",
			href: mark.url,
			target: blank ? "_blank" : undefined,
			rel: blank ? "noopener noreferrer" : undefined,
		};
	}

	if (isStegaVariant(mark, "linkType", "linkInternal")) {
		const href = createLanguagePathUtils(siteLocale).hrefFor(
			mark.resolvedReference?.path,
			locale,
		);
		return href ? { kind: "anchor", href, internal: true } : null;
	}

	if (isStegaVariant(mark, "linkType", "linkFunction")) {
		return resolveFunctionLink(mark.func?.key, mark.func?.params);
	}

	return null;
}
