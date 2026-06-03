import type {
	ContentRefRoute,
	ModuleContentRefTarget,
} from "@/sanity/types/modules/contentRefs";

/** Locale-aware href for a content-refs list item. */
export function contentRefTargetHref(
	target: ModuleContentRefTarget,
	localePath: (pathname: string, locale: string) => string,
	locale: string,
): string | null {
	if (!target?._type) return null;
	const route = target.route as ContentRefRoute | null | undefined;
	const slug = typeof target.slug === "string" ? target.slug.trim() : "";

	if (route === "index" || target._type === "home") {
		return localePath("/", locale);
	}
	if (route === "project" || target._type === "project") {
		if (!slug) return null;
		return localePath(`/work/${slug}`, locale);
	}
	if (slug) {
		return localePath(`/${slug}`, locale);
	}
	return null;
}
