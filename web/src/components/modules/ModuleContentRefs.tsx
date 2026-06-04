import type { ModuleContentRefsData } from "@/sanity/types/modules";
import type { ModuleContentRefListItem } from "@/sanity/types/modules/contentRefs";
import { pickLocalizedString } from "@/sanity/utils/sanityLocalizedText";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { createLanguagePathUtils } from "@/src/i18n/siteLocalePathUtils";
import { contentRefTargetHref } from "@/src/utils/contentRefHref";

import { ModuleContentRefsClient } from "./ModuleContentRefsClient";
import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	module: ModuleContentRefsData;
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
};

// ─── Component ───────────────────────────────────────────────────────────────

/** `module.contentRefs` — resolved reference list with optional project filters. */
export function ModuleContentRefs({ module, locale, siteLocale }: Props) {
	const heading = pickLocalizedString(module.heading, locale, siteLocale);
	const { localePath } = createLanguagePathUtils(siteLocale);
	const items: ModuleContentRefListItem[] = (module.references ?? [])
		.filter(
			(item): item is NonNullable<typeof item> => item != null && !!item._type,
		)
		.map((item) => ({
			...item,
			href: contentRefTargetHref(item, localePath, locale),
		}));
	const isProjectList = module.sourceScope === "projects";
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
			/>
		</section>
	);
}
