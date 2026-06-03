/**
 * `siteNav` menu items after `linkQuery` expansion (see `sanity/queries/snippets/link.ts`).
 *
 * `title` is an `internationalizedArrayString` (per-locale entries). `resolvedReference.title`
 * carries the referenced document's localized title for internal-link fallback. Plain `string`
 * is allowed for forward-compat with the document-level i18n variant.
 */
import type { IntlStringEntry } from "../utils";

export type NavLinkTitle = IntlStringEntry[] | string | null;

export type NavLinkInternal = {
	_key?: string;
	_type: "link";
	type: "internal";
	linkType: "linkInternal";
	title?: NavLinkTitle;
	route?: string | null;
	slug?: string | null;
	resolvedReference?: {
		_type?: string | null;
		_id?: string | null;
		title?: NavLinkTitle;
		slug?: string | null;
	} | null;
};

export type NavLinkExternal = {
	_key?: string;
	_type: "link";
	type: "external";
	linkType: "linkExternal";
	title?: NavLinkTitle;
	href?: string | null;
	blank?: boolean | null;
};

export type NavLinkFunction = {
	_key?: string;
	_type: "link";
	type: "function";
	linkType: "linkFunction";
	title?: NavLinkTitle;
	func?: { key?: string | null; params?: string | null } | null;
};

export type NavMenuLink = NavLinkInternal | NavLinkExternal | NavLinkFunction;

/** Marker block from Studio — renders the locale `<select>` at this position in the main menu. */
export type NavLanguageSwitchItem = {
	_key?: string;
	_type: "nav.languageSwitch";
};

/** Marker block from Studio — renders the light/dark theme toggle at this position in the main menu. */
export type NavThemeToggleItem = {
	_key?: string;
	_type: "nav.themeToggle";
};

export type MainMenuItem =
	| NavMenuLink
	| NavLanguageSwitchItem
	| NavThemeToggleItem;

export type SiteNavMenusDocument = {
	_id: string;
	title?: string | null;
	mainMenu?: MainMenuItem[] | null;
	footerMenu?: NavMenuLink[] | null;
};
