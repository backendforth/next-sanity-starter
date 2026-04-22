import type { MainMenuItem, NavMenuLink } from "@/sanity/types/nav";
import type { LanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";

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
			action: "open-modal";
			params?: string | null;
	  };

/** Main menu row or inline language switch (from `nav.languageSwitch` in Studio). */
export type MainMenuEntry =
	| ResolvedNavRow
	| { kind: "languageSwitch"; id: string };

function rowId(link: NavMenuLink, index: number, idPrefix: string): string {
	const k = link._key;
	if (typeof k === "string" && k.length > 0) {
		return `${idPrefix}-${k}`;
	}
	return `${idPrefix}-${index}`;
}

function labelFor(link: NavMenuLink): string {
	const t = link.title;
	if (typeof t === "string" && t.trim().length > 0) {
		return t.trim();
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
): ResolvedNavRow | null {
	const label = labelFor(link);

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

		return null;
	}

	return null;
}

export function resolveMenuRows(
	menu: NavMenuLink[] | null | undefined,
	locale: string,
	pathUtils: Pick<LanguagePathUtils, "localePath">,
	idPrefix: string,
): ResolvedNavRow[] {
	if (!menu?.length) {
		return [];
	}
	const out: ResolvedNavRow[] = [];
	menu.forEach((link, index) => {
		const row = resolveNavMenuLink(link, locale, index, pathUtils, idPrefix);
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
): ResolvedNavRow[] {
	return resolveMenuRows(mainMenu, locale, pathUtils, "nav");
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
		const row = resolveNavMenuLink(item, locale, index, pathUtils, "nav");
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
): ResolvedNavRow[] {
	return resolveMenuRows(footerMenu, locale, pathUtils, "footer");
}
