import type { MainMenuItem, NavMenuLink } from "@/sanity/types/nav";
import { resolveLinkLabel } from "@/sanity/utils/resolveLinkLabel";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import type { LanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

type SiteLocaleSlice = Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;

export type ResolvedNavRow =
	| {
			id: string;
			label: string;
			kind: "link";
			href: string;
			external?: boolean;
			blank?: boolean;
	  }
	| {
			id: string;
			label: string;
			kind: "button";
			action: "open-modal" | "open-cookie-preferences";
			params?: string | null;
	  };

/** Main menu row, inline language switch (`nav.languageSwitch`), or theme toggle (`nav.themeToggle`) from Studio. */
export type MainMenuEntry =
	| ResolvedNavRow
	| { kind: "languageSwitch"; id: string }
	| { kind: "themeToggle"; id: string };

function rowId(link: NavMenuLink, index: number, idPrefix: string): string {
	const k = link._key;
	if (typeof k === "string" && k.length > 0) {
		return `${idPrefix}-${k}`;
	}
	return `${idPrefix}-${index}`;
}

function labelFor(
	link: NavMenuLink,
	locale: string,
	siteLocale: SiteLocaleSlice | null | undefined,
): string {
	if (link.type === "internal" && link.linkType === "linkInternal") {
		return resolveLinkLabel({
			linkTitle: link.title,
			referenceTitle: link.resolvedReference?.title,
			locale,
			siteLocale,
		});
	}
	if (link.type === "external" && link.linkType === "linkExternal") {
		return resolveLinkLabel({
			linkTitle: link.title,
			externalUrl: link.href,
			locale,
			siteLocale,
		});
	}
	if (link.type === "function" && link.linkType === "linkFunction") {
		return resolveLinkLabel({
			linkTitle: link.title,
			functionKey: link.func?.key,
			locale,
			siteLocale,
		});
	}
	return "Link";
}

function internalHref(
	link: Extract<NavMenuLink, { type: "internal" }>,
	locale: string,
	localePath: LanguagePathUtils["localePath"],
): string | null {
	const refType = link.resolvedReference?._type;
	const route = link.route;
	const slug = typeof link.slug === "string" ? link.slug.trim() : "";

	if (refType === "home" || route === "page") {
		return localePath("/", locale);
	}
	if (refType === "work" || route === "work") {
		return localePath("/work", locale);
	}
	if (refType === "project" || route === "project") {
		if (!slug) {
			return null;
		}
		return localePath(`/work/${slug}`, locale);
	}
	if (slug.length > 0) {
		return localePath(`/${slug}`, locale);
	}
	return null;
}

export function resolveNavMenuLink(
	link: NavMenuLink,
	locale: string,
	index: number,
	pathUtils: Pick<LanguagePathUtils, "localePath">,
	idPrefix = "nav",
	siteLocale?: SiteLocaleSlice | null,
): ResolvedNavRow | null {
	const label = labelFor(link, locale, siteLocale);

	if (link.type === "internal" && link.linkType === "linkInternal") {
		const href = internalHref(link, locale, pathUtils.localePath);
		if (!href) {
			return null;
		}
		return {
			id: rowId(link, index, idPrefix),
			label,
			kind: "link",
			href,
		};
	}

	if (link.type === "external" && link.linkType === "linkExternal") {
		const href = typeof link.href === "string" ? link.href.trim() : "";
		if (!href) {
			return null;
		}
		return {
			id: rowId(link, index, idPrefix),
			label,
			kind: "link",
			href,
			external: true,
			blank: link.blank !== false,
		};
	}

	if (link.type === "function" && link.linkType === "linkFunction") {
		const key = link.func?.key;
		const params =
			typeof link.func?.params === "string" ? link.func.params : null;

		if (key === "scroll-to") {
			const anchor =
				typeof params === "string" && params.trim().length > 0
					? params.trim()
					: "";
			if (!anchor) {
				return null;
			}
			const hash = anchor.startsWith("#") ? anchor : `#${anchor}`;
			return {
				id: rowId(link, index, idPrefix),
				label,
				kind: "link",
				href: hash,
			};
		}

		if (key === "open-modal") {
			return {
				id: rowId(link, index, idPrefix),
				label,
				kind: "button",
				action: "open-modal",
				params,
			};
		}

		if (key === "open-cookie-preferences") {
			return {
				id: rowId(link, index, idPrefix),
				label,
				kind: "button",
				action: "open-cookie-preferences",
				params: null,
			};
		}

		return null;
	}

	return null;
}

export function resolveMenuRows(
	menu: NavMenuLink[] | null | undefined,
	locale: string,
	pathUtils: Pick<LanguagePathUtils, "localePath">,
	idPrefix: string,
	siteLocale?: SiteLocaleSlice | null,
): ResolvedNavRow[] {
	if (!menu?.length) {
		return [];
	}
	const out: ResolvedNavRow[] = [];
	menu.forEach((link, index) => {
		const row = resolveNavMenuLink(
			link,
			locale,
			index,
			pathUtils,
			idPrefix,
			siteLocale,
		);
		if (row) {
			out.push(row);
		}
	});
	return out;
}

export function resolveMainMenuRows(
	mainMenu: NavMenuLink[] | null | undefined,
	locale: string,
	pathUtils: Pick<LanguagePathUtils, "localePath">,
	siteLocale?: SiteLocaleSlice | null,
): ResolvedNavRow[] {
	return resolveMenuRows(mainMenu, locale, pathUtils, "nav", siteLocale);
}

function mainMenuEntryId(item: MainMenuItem, index: number): string {
	const k = item._key;
	if (typeof k === "string" && k.length > 0) {
		return `nav-${k}`;
	}
	return `nav-${index}`;
}

/**
 * Resolves the main menu in order: links become {@link ResolvedNavRow};
 * `nav.languageSwitch` blocks become a single `languageSwitch` entry.
 */
export function resolveMainMenuEntries(
	mainMenu: MainMenuItem[] | null | undefined,
	locale: string,
	pathUtils: Pick<LanguagePathUtils, "localePath">,
	siteLocale?: SiteLocaleSlice | null,
): MainMenuEntry[] {
	if (!mainMenu?.length) {
		return [];
	}
	const out: MainMenuEntry[] = [];
	mainMenu.forEach((item, index) => {
		if (item._type === "nav.languageSwitch") {
			out.push({
				kind: "languageSwitch",
				id: mainMenuEntryId(item, index),
			});
			return;
		}
		if (item._type === "nav.themeToggle") {
			out.push({
				kind: "themeToggle",
				id: mainMenuEntryId(item, index),
			});
			return;
		}
		const row = resolveNavMenuLink(
			item,
			locale,
			index,
			pathUtils,
			"nav",
			siteLocale,
		);
		if (row) {
			out.push(row);
		}
	});
	return out;
}

export function resolveFooterMenuRows(
	footerMenu: NavMenuLink[] | null | undefined,
	locale: string,
	pathUtils: Pick<LanguagePathUtils, "localePath">,
	siteLocale?: SiteLocaleSlice | null,
): ResolvedNavRow[] {
	return resolveMenuRows(footerMenu, locale, pathUtils, "footer", siteLocale);
}
