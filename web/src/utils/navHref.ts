/**
 * Nav rows from `siteNav`, resolved on the server for the route's locale: hrefs and the
 * cookie-preferences action from `resolveLinkMark` (the rich-text resolver), labels from
 * `resolveLinkLabel`. A link without a target drops its row.
 */

import type { MainMenuItem, NavMenuLink } from "@/sanity/types";
import {
	type LinkLocaleOptions,
	resolveLinkMark,
} from "@/sanity/utils/linkResolver";
import { resolveLinkLabel } from "@/sanity/utils/resolveLinkLabel";

export type ResolvedNavRow =
	| {
			id: string;
			label: string;
			kind: "link";
			href: string;
			external: boolean;
			blank: boolean;
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

/** `_key`, or the position for an item without one, under the menu's prefix. */
function rowId(item: { _key?: string | null }, index: number, prefix: string) {
	return `${prefix}-${item._key || index}`;
}

function navRow(
	link: NavMenuLink,
	id: string,
	options: LinkLocaleOptions,
): ResolvedNavRow | null {
	const resolved = resolveLinkMark(link, options);
	if (!resolved) return null;
	const label = resolveLinkLabel(link, options);
	if (resolved.kind === "cookie-preferences") {
		return { id, label, kind: "button", action: "open-cookie-preferences" };
	}
	return {
		id,
		label,
		kind: "link",
		href: resolved.href,
		external: !resolved.internal,
		blank: resolved.target === "_blank",
	};
}

/** The main menu in Studio order: link rows, the language switch and the theme toggle. */
export function resolveMainMenuEntries(
	mainMenu: MainMenuItem[] | null | undefined,
	options: LinkLocaleOptions,
): MainMenuEntry[] {
	return (mainMenu ?? []).flatMap<MainMenuEntry>((item, index) => {
		const id = rowId(item, index, "nav");
		if (item._type === "nav.languageSwitch") {
			return { kind: "languageSwitch", id };
		}
		if (item._type === "nav.themeToggle") {
			return { kind: "themeToggle", id };
		}
		return navRow(item, id, options) ?? [];
	});
}

export function resolveFooterMenuRows(
	footerMenu: NavMenuLink[] | null | undefined,
	options: LinkLocaleOptions,
): ResolvedNavRow[] {
	return (footerMenu ?? []).flatMap(
		(link, index) => navRow(link, rowId(link, index, "footer"), options) ?? [],
	);
}
