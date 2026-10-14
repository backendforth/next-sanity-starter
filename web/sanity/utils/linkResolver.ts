/**
 * Resolves a Portable Text `link` mark into anchor props. Internal targets carry their `path`
 * from GROQ (`routePathProjection`) and get the locale prefix (`hrefFor`). For nav rows see
 * `src/utils/navHref.ts`.
 */

import type { LinkMark } from "@/sanity/types";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

import { isStegaVariant } from "./stegaVariant";

/** The active locale plus the config that decides whether it gets a path prefix. */
export type LinkLocaleOptions = {
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
};

export type ResolvedLink =
	| {
			kind: "anchor";
			href: string;
			target?: "_blank";
			rel?: "noopener noreferrer";
	  }
	| { kind: "function" }
	| null;

/**
 * Resolve a Portable Text `link` mark into a payload the renderer can spread
 * onto an anchor (`{ kind: "anchor", href, target?, rel? }`), a marker for
 * function-key actions that render as plain spans (`{ kind: "function" }`),
 * or `null` when the mark cannot be resolved.
 */
export function resolveLinkMark(
	mark: LinkMark | null | undefined,
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
		return href ? { kind: "anchor", href } : null;
	}

	if (isStegaVariant(mark, "linkType", "linkFunction")) {
		return { kind: "function" };
	}

	return null;
}
