import type { ModuleTextData } from "@/sanity/types/modules";
import {
	pickLocalizedPortableTextBlocks,
	pickLocalizedString,
} from "@/sanity/utils/sanityLocalizedText";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";
import { RichTextMedia } from "../text/RichTextMedia";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	module: ModuleTextData;
	locale: string;
	siteLocale: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ModuleText({ module, locale, siteLocale }: Props) {
	const title = pickLocalizedString(module.title, locale, siteLocale);
	const blocks = pickLocalizedPortableTextBlocks(
		module.body,
		locale,
		siteLocale,
	);

	return (
		<article className="flex flex-col gap-4 border-b border-color-border-subtle pb-10 last:border-b-0 last:pb-0">
			{title ? <h2>{title}</h2> : null}
			<RichTextMedia value={blocks} />
		</article>
	);
}
