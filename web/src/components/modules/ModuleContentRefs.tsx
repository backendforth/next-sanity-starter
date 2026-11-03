import { stegaClean } from "next-sanity";

import type { ModuleOf } from "@/sanity/types";
import { plainText } from "@/sanity/utils/sanityLocalizedText";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { uiLabel } from "@/src/i18n/uiLabels";

import { ContentRefList } from "./ContentRefList";
import { LazyModuleContentRefsClient } from "./LazyModuleContentRefsClient";
import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

/** One referenced document, as the query projects it. Here, not in `@/sanity/types`, so it goes with the module. */
type ContentRefTarget = NonNullable<
	NonNullable<ModuleOf<"module.contentRefs">["references"]>[number]
>;

/** A list entry with its href and labels resolved for the route's locale on the server. */
export type ContentRefListItem = {
	key: string;
	href: string | null;
	label: string;
	createdAt: string;
	categories: { id: string; label: string }[];
	previewImage: ContentRefTarget["previewImage"];
};

type Props = {
	module: ModuleOf<"module.contentRefs">;
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
	/**
	 * First module on the page — its first card image is the LCP candidate and
	 * loads eagerly. Set by `ModulesRenderer` for index 0.
	 */
	priority?: boolean;
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `module.contentRefs` — resolved reference list. Only a project list has controls (sort, category
 * filters) and loads the client part; every other list is static markup from the server.
 * Document-level i18n: references are GROQ-filtered to the active locale and carry plain
 * `title` / `slug` strings.
 */
export function ModuleContentRefs({
	module,
	locale,
	siteLocale,
	priority = false,
}: Props) {
	const heading = plainText(module.heading);
	const { hrefFor } = createLanguagePathUtils(siteLocale);
	const items: ContentRefListItem[] = (module.references ?? [])
		.filter((item) => item != null)
		.map((item) => ({
			key: item._id,
			href: hrefFor(item.path, locale),
			/* `typeof`: a main-shaped target in a shared dataset carries a localized array. */
			label:
				(typeof item.title === "string" ? plainText(item.title) : undefined) ??
				plainText(item.slug) ??
				uiLabel("untitled", locale),
			createdAt: item._createdAt,
			/* A deleted category dereferences to `null`. */
			categories: (item.categories ?? []).flatMap((category) => {
				const label = plainText(category?.title);
				return category && label ? [{ id: category._id, label }] : [];
			}),
			previewImage: item.previewImage,
		}));
	/* In Presentation the value carries invisible stega markers; compare the clean string. */
	const isProjectList = stegaClean(module.sourceScope) === "projects";

	if (items.length === 0) {
		return null;
	}

	return (
		<section className={moduleSectionClassName}>
			{heading ? <h2 className={moduleHeadingClassName}>{heading}</h2> : null}
			{isProjectList ? (
				<LazyModuleContentRefsClient
					locale={locale}
					items={items}
					showCategoryFilters={module.showProjectFilters !== false}
					priority={priority}
				/>
			) : (
				<ContentRefList items={items} priority={priority} />
			)}
		</section>
	);
}
