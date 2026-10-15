import type { ModuleOf } from "@/sanity/types";
import {
	pickLocalizedPortableTextBlocks,
	pickLocalizedString,
} from "@/sanity/utils/sanityLocalizedText";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	module: ModuleOf<"module.text">;
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
	/** First module on the page: its first embed is the LCP candidate. */
	priority?: boolean;
};

// ─── Component ───────────────────────────────────────────────────────────────

/** `module.text` — optional title + localized rich text body (with embedded modules). */
export function ModuleText({
	module,
	locale,
	siteLocale,
	priority = false,
}: Props) {
	const title = pickLocalizedString(module.title, locale, siteLocale);
	const blocks = pickLocalizedPortableTextBlocks(
		module.body,
		locale,
		siteLocale,
	);

	return (
		<section className={moduleSectionClassName}>
			{title ? <h2 className={moduleHeadingClassName}>{title}</h2> : null}
			<RichTextMedia
				value={blocks}
				locale={locale}
				siteLocale={siteLocale}
				priority={priority}
			/>
		</section>
	);
}
