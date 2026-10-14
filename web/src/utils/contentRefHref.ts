import type { ContentRefTarget } from "@/sanity/types";

/** Locale-aware href for a content-refs list item; `null` when a page or project has no slug. */
export function contentRefTargetHref(
	target: ContentRefTarget,
	localePath: (pathname: string, locale: string) => string,
	locale: string,
): string | null {
	if (target._type === "home") {
		return localePath("/", locale);
	}
	const slug = target.slug?.trim();
	if (!slug) return null;
	if (target._type === "project") {
		return localePath(`/work/${slug}`, locale);
	}
	return localePath(`/${slug}`, locale);
}
