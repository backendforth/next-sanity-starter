import type { MainMenuItem, NavMenuLink } from "@/sanity/types";
import { resolveFunctionLink } from "@/sanity/utils/linkResolver";
import { resolveLinkLabel } from "@/sanity/utils/resolveLinkLabel";
import { isStegaVariant } from "@/sanity/utils/stegaVariant";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import type { LanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { uiLabel } from "@/src/i18n/uiLabels";

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
			action: "open-cookie-preferences";
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
	if (isStegaVariant(link, "linkType", "linkInternal")) {
		return resolveLinkLabel({
			linkTitle: link.title,
			referenceTitle: link.resolvedReference?.title,
			locale,
			siteLocale,
		});
	}
	if (isStegaVariant(link, "linkType", "linkExternal")) {
		return resolveLinkLabel({
			linkTitle: link.title,
			externalUrl: link.url,
			locale,
			siteLocale,
		});
	}
	if (isStegaVariant(link, "linkType", "linkFunction")) {
		return resolveLinkLabel({
			linkTitle: link.title,
			functionKey: link.func?.key,
			locale,
			siteLocale,
		});
	}
	return uiLabel("link", locale);
}

function resolveNavMenuLink(
	link: NavMenuLink,
	locale: string,
	index: number,
	pathUtils: Pick<LanguagePathUtils, "hrefFor">,
	idPrefix = "nav",
	siteLocale?: SiteLocaleSlice | null,
): ResolvedNavRow | null {
	const label = labelFor(link, locale, siteLocale);

	if (isStegaVariant(link, "linkType", "linkInternal")) {
		/* `path` is `null` for a deleted or unpublished target: the row is dropped. */
		const href = pathUtils.hrefFor(link.resolvedReference?.path, locale);
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

	if (isStegaVariant(link, "linkType", "linkExternal")) {
		const href = typeof link.url === "string" ? link.url.trim() : "";
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

	if (isStegaVariant(link, "linkType", "linkFunction")) {
		const target = resolveFunctionLink(link.func?.key, link.func?.params);
		if (target?.kind === "cookie-preferences") {
			return {
				id: rowId(link, index, idPrefix),
				label,
				kind: "button",
				action: "open-cookie-preferences",
			};
		}
		if (target?.kind === "anchor") {
			return {
				id: rowId(link, index, idPrefix),
				label,
				kind: "link",
				href: target.href,
			};
		}
		return null;
	}

	return null;
}

function resolveMenuRows(
	menu: NavMenuLink[] | null | undefined,
	locale: string,
	pathUtils: Pick<LanguagePathUtils, "hrefFor">,
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
	pathUtils: Pick<LanguagePathUtils, "hrefFor">,
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
	pathUtils: Pick<LanguagePathUtils, "hrefFor">,
	siteLocale?: SiteLocaleSlice | null,
): ResolvedNavRow[] {
	return resolveMenuRows(footerMenu, locale, pathUtils, "footer", siteLocale);
}
