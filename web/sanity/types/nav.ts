/**
 * `siteNav` menu items after `linkQuery` expansion (see `sanity/queries/snippets/link.ts`).
 */
export type NavLinkInternal = {
	_key?: string;
	_type: "link";
	type: "internal";
	linkType: "linkInternal";
	title?: string | null;
	route?: string | null;
	slug?: string | null;
	resolvedReference?: { _type?: string | null; _id?: string | null } | null;
};

export type NavLinkExternal = {
	_key?: string;
	_type: "link";
	type: "external";
	linkType: "linkExternal";
	title?: string | null;
	href?: string | null;
	blank?: boolean | null;
};

export type NavLinkFunction = {
	_key?: string;
	_type: "link";
	type: "function";
	linkType: "linkFunction";
	title?: string | null;
	func?: { key?: string | null; params?: string | null } | null;
};

export type NavMenuLink = NavLinkInternal | NavLinkExternal | NavLinkFunction;

export type SiteNavMenusDocument = {
	_id: string;
	title?: string | null;
	mainMenu?: NavMenuLink[] | null;
	footerMenu?: NavMenuLink[] | null;
};
