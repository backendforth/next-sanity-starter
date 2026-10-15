/**
 * Polymorphic URL/anchor resolver for Sanity link marks and document refs.
 *
 * Extracted from `RichTextMedia` so the same resolution logic is reusable from
 * any renderer (cards, callouts, embedded module links). For nav menus see
 * `web/src/utils/navHref.ts` — that file consumes a different shape
 * (`NavMenuLink`) and handles `route` / function actions specific to nav rows.
 */

import type { LinkMark } from "@/sanity/types";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

import { isStegaVariant } from "./stegaVariant";

/** The active locale plus the config that decides whether it gets a path prefix. */
export type LinkLocaleOptions = {
	locale?: string;
	siteLocale?: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale"> | null;
};

/** The part of a resolved reference that decides its route. */
export type LinkResolvedRef = {
	_type?: string;
	slug?: string | null;
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

function refPath(ref: LinkResolvedRef | null | undefined): string | undefined {
	if (ref?._type === "home") return "/";
	if (ref?._type === "page" && ref.slug) return `/${ref.slug}`;
	if (ref?._type === "work") return "/work";
	if (ref?._type === "project" && ref.slug) return `/work/${ref.slug}`;
	return undefined;
}

/**
 * URL for a polymorphic document reference (`home`, `page`, `work`, `project`). Returns
 * `undefined` for unknown ref shapes so callers can skip rendering the link.
 *
 * With `locale` and `siteLocale` the path goes through `localePath` (`/de/about`, no prefix
 * for the default locale); without them it stays locale-agnostic.
 */
export function resolveRefHref(
	ref: LinkResolvedRef | null | undefined,
	options?: LinkLocaleOptions,
): string | undefined {
	const path = refPath(ref);
	if (!path) return undefined;
	const { locale, siteLocale } = options ?? {};
	if (!locale || !siteLocale) return path;
	return createLanguagePathUtils(siteLocale).localePath(path, locale);
}

/**
 * Resolve a Portable Text `link` mark into a payload the renderer can spread
 * onto an anchor (`{ kind: "anchor", href, target?, rel? }`), a marker for
 * function-key actions that render as plain spans (`{ kind: "function" }`),
 * or `null` when the mark cannot be resolved.
 */
export function resolveLinkMark(
	mark: LinkMark | null | undefined,
	options?: LinkLocaleOptions,
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
		const href = resolveRefHref(mark.resolvedReference, options);
		return href ? { kind: "anchor", href } : null;
	}

	if (isStegaVariant(mark, "linkType", "linkFunction")) {
		return { kind: "function" };
	}

	return null;
}
