import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import clsx from "clsx";
import type { LinkMark } from "@/sanity/utils/linkResolver";

import { portableTextMediaComponents } from "./portableTextComponents";

/** @deprecated Import `LinkMark` from `@/sanity/utils/linkResolver` instead. */
export type RichTextMediaLinkMark = LinkMark;

type RichTextMediaProps = {
	value: PortableTextBlock[];
	className?: string;
};

/**
 * Renders Portable Text from **`richTextMedia`** (blocks, links, embedded `module.*`).
 * Document-level variant: the document is already in one locale, so this renderer
 * takes no locale/siteLocale props.
 */
export function RichTextMedia({ value, className }: RichTextMediaProps) {
	if (!value.length) return null;

	return (
		<div
			className={clsx("rich-text rich-text-media w-full min-w-0", className)}
		>
			<PortableText
				value={value}
				components={portableTextMediaComponents()}
				onMissingComponent={false}
			/>
		</div>
	);
}
