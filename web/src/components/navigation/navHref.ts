import type { NavMenuLink } from "@/sanity/types/nav";
import type { AppLocale } from "@/src/i18n/config";
import { localePath } from "@/src/i18n/paths";

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
	locale: AppLocale,
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
	locale: AppLocale,
	index: number,
	idPrefix = "nav",
): ResolvedNavRow | null {
	const label = labelFor(link);

	if (link.type === "internal" && link.linkType === "linkInternal") {
		const href = internalHref(link, locale);
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
	locale: AppLocale,
	idPrefix: string,
): ResolvedNavRow[] {
	if (!menu?.length) {
		return [];
	}
	const out: ResolvedNavRow[] = [];
	menu.forEach((link, index) => {
		const row = resolveNavMenuLink(link, locale, index, idPrefix);
		if (row) {
			out.push(row);
		}
	});
	return out;
}

export function resolveMainMenuRows(
	mainMenu: NavMenuLink[] | null | undefined,
	locale: AppLocale,
): ResolvedNavRow[] {
	return resolveMenuRows(mainMenu, locale, "nav");
}

export function resolveFooterMenuRows(
	footerMenu: NavMenuLink[] | null | undefined,
	locale: AppLocale,
): ResolvedNavRow[] {
	return resolveMenuRows(footerMenu, locale, "footer");
}
