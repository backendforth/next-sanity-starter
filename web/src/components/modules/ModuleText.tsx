import type { ModuleTextData } from "@/sanity/types/modules";
import {
	pickLocalizedPortableTextBlocks,
	pickLocalizedString,
} from "@/sanity/utils/sanityLocalizedText";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	module: ModuleTextData;
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
};

// ─── Component ───────────────────────────────────────────────────────────────

/** `module.text` — optional title + localized rich text body (with embedded modules). */
export function ModuleText({ module, locale, siteLocale }: Props) {
	const title = pickLocalizedString(module.title, locale, siteLocale);
	const blocks = pickLocalizedPortableTextBlocks(
		module.body,
		locale,
		siteLocale,
	);

	return (
		<article className={moduleSectionClassName}>
			{title ? <h2 className={moduleHeadingClassName}>{title}</h2> : null}
			<RichTextMedia value={blocks} locale={locale} siteLocale={siteLocale} />
		</article>
	);
}
