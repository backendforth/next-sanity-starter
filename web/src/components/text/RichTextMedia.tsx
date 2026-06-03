import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import clsx from "clsx";
import type { LinkMark } from "@/sanity/utils/linkResolver";
import type { SiteLocaleConfig } from "@/src/i18n/fallbackSiteLocales";

import { portableTextMediaComponents } from "./portableTextComponents";

/** @deprecated Import `LinkMark` from `@/sanity/utils/linkResolver` instead. */
export type RichTextMediaLinkMark = LinkMark;

type RichTextMediaProps = {
	value: PortableTextBlock[];
	className?: string;
	/** Required when rich text bodies may embed `module.carousel` (localized heading). */
	locale?: string;
	siteLocale?: Pick<SiteLocaleConfig, "localeIds" | "defaultLocale">;
};

/**
 * Renders Portable Text from **`richTextMedia`** (blocks, links, embedded `module.*`).
 * Feed values from `pickLocalizedPortableTextBlocks` for i18n `body` fields.
 */
export function RichTextMedia({
	value,
	className,
	locale,
	siteLocale,
}: RichTextMediaProps) {
	if (!value.length) return null;

	return (
		<div
			className={clsx("rich-text rich-text-media w-full min-w-0", className)}
		>
			<PortableText
				value={value}
				components={portableTextMediaComponents({ locale, siteLocale })}
				onMissingComponent={false}
			/>
		</div>
	);
}
