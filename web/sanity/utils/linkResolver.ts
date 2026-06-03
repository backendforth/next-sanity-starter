/**
 * Polymorphic URL/anchor resolver for Sanity link marks and document refs.
 *
 * Extracted from `RichTextMedia` so the same resolution logic is reusable from
 * any renderer (cards, callouts, embedded module links). For nav menus see
 * `web/src/utils/navHref.ts` — that file consumes a different shape
 * (`NavMenuLink`) and handles `route` / function actions specific to nav rows.
 */

import type { IntlStringEntry } from "./sanityLocalizedText";

export type LinkResolvedRef = {
	_type?: string;
	slug?: string | null;
	title?: IntlStringEntry[] | string | null;
};

/** Portable Text `link` mark — aligned with GROQ `linkQuery` / `studio/schemas/objects/link.ts`. */
export type LinkMark = {
	_type?: string;
	type?: "internal" | "external" | "function" | string;
	title?: IntlStringEntry[] | string | null;
	url?: string | null;
	href?: string | null;
	blank?: boolean | null;
	resolvedReference?: LinkResolvedRef | null;
	func?: { key?: string; params?: string | null } | null;
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
 * URL for a polymorphic document reference (`home`, `page`, `project`). Returns
 * `undefined` for unknown ref shapes so callers can skip rendering the link.
 *
 * Pass `locale` to prefix the path (e.g. `/de/about`); leave it undefined
 * for callers that don't know the active locale (link stays root-relative).
 */
export function resolveRefHref(
	ref: LinkResolvedRef | null | undefined,
	options?: { locale?: string },
): string | undefined {
	if (!ref?._type) return undefined;
	const prefix = options?.locale ? `/${options.locale}` : "";
	if (ref._type === "home") return prefix || "/";
	if (ref._type === "page" && ref.slug) return `${prefix}/${ref.slug}`;
	if (ref._type === "project" && ref.slug) return `${prefix}/work/${ref.slug}`;
	return undefined;
}

/**
 * Resolve a Portable Text `link` mark into a payload the renderer can spread
 * onto an anchor (`{ kind: "anchor", href, target?, rel? }`), a marker for
 * function-key actions that render as plain spans (`{ kind: "function" }`),
 * or `null` when the mark cannot be resolved.
 */
export function resolveLinkMark(
	mark: LinkMark | null | undefined,
	options?: { locale?: string },
): ResolvedLink {
	if (mark?._type !== "link") return null;

	if (mark.type === "external" && mark.url) {
		const blank = mark.blank !== false;
		return {
			kind: "anchor",
			href: mark.url,
			target: blank ? "_blank" : undefined,
			rel: blank ? "noopener noreferrer" : undefined,
		};
	}

	if (mark.type === "internal") {
		const href = resolveRefHref(mark.resolvedReference, options);
		if (href) return { kind: "anchor", href };
	}

	if (mark.type === "function") {
		return { kind: "function" };
	}

	return null;
}
