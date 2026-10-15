import "server-only";

import clsx from "clsx";
import { PortableText } from "next-sanity";

import type { RichTextMediaValue } from "@/sanity/types";
import type { LinkLocaleOptions } from "@/sanity/utils/linkResolver";

import { portableTextMediaComponents } from "./portableTextComponents";

type RichTextMediaProps = LinkLocaleOptions & {
	value: RichTextMediaValue;
	className?: string;
	/** The body opens the page: its first embed is the LCP candidate and loads eagerly. */
	priority?: boolean;
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
	priority = false,
}: RichTextMediaProps) {
	if (!value.length) return null;
	const priorityKey = priority
		? value.find((item) => item._type !== "block")?._key
		: undefined;

	return (
		<div
			className={clsx("rich-text rich-text-media w-full min-w-0", className)}
		>
			<PortableText
				value={value}
				components={portableTextMediaComponents({
					locale,
					siteLocale,
					priorityKey,
				})}
				onMissingComponent={false}
			/>
		</div>
	);
}
