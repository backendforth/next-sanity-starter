import type { ModuleOf } from "@/sanity/types";
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

/**
 * `module.text` — optional heading + rich text body (with embedded modules).
 * Document-level i18n: fields are plain values (document is in one locale).
 */
export function ModuleText({
	module,
	locale,
	siteLocale,
	priority = false,
}: Props) {
	const heading = module.heading?.trim();
	const blocks = module.body ?? [];

	return (
		<section className={moduleSectionClassName}>
			{heading ? <h2 className={moduleHeadingClassName}>{heading}</h2> : null}
			<RichTextMedia
				value={blocks}
				locale={locale}
				siteLocale={siteLocale}
				priority={priority}
			/>
		</section>
	);
}
