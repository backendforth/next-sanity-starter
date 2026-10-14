import { stegaClean } from "next-sanity";

import type { ContentRefTarget, ModuleOf } from "@/sanity/types";
import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { contentRefTargetHref } from "@/src/utils/contentRefHref";

import { ModuleContentRefsClient } from "./ModuleContentRefsClient";
import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A list entry with its locale-aware href, resolved on the server. */
export type ContentRefListItem = ContentRefTarget & { href: string | null };

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

/** `module.contentRefs` — resolved reference list with optional project filters. */
export function ModuleContentRefs({
	module,
	locale,
	siteLocale,
	priority = false,
}: Props) {
	const heading = pickLocalizedString(module.heading, locale, siteLocale);
	const { localePath } = createLanguagePathUtils(siteLocale);
	const items: ContentRefListItem[] = (module.references ?? [])
		.filter((item) => item != null)
		.map((item) => ({
			...item,
			href: contentRefTargetHref(item, localePath, locale),
		}));
	/* In Presentation the value carries invisible stega markers; compare the clean string. */
	const isProjectList = stegaClean(module.sourceScope) === "projects";
	const showCategoryFilters = module.showProjectFilters !== false;

	if (items.length === 0) {
		return null;
	}

	return (
		<section className={moduleSectionClassName}>
			{heading ? <h2 className={moduleHeadingClassName}>{heading}</h2> : null}
			<ModuleContentRefsClient
				locale={locale}
				siteLocale={siteLocale}
				items={items}
				isProjectList={isProjectList}
				showCategoryFilters={showCategoryFilters}
				priority={priority}
			/>
		</section>
	);
}
