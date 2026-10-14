import "server-only";

import clsx from "clsx";
import { PortableText } from "next-sanity";

import type { RichTextMediaValue } from "@/sanity/types";
import type { LinkLocaleOptions } from "@/sanity/utils/linkResolver";

import { portableTextMediaComponents } from "./portableTextComponents";

type RichTextMediaProps = LinkLocaleOptions & {
	value: RichTextMediaValue;
	className?: string;
};

/**
 * Renders Portable Text from **`richTextMedia`** (blocks, links, embedded `module.*`).
 * Feed values from `pickLocalizedPortableTextBlocks` for i18n `body` fields. `locale` points
 * internal links at that locale's version of the target.
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
