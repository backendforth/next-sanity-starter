import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import clsx from "clsx";

import { portableTextBlockComponents } from "./portableTextComponents";

type RichTextProps = {
	value: PortableTextBlock[];
	className?: string;
};

/**
 * Renders Portable Text from Studio **`richText`** / `internationalizedArrayRichText`
 * (blocks and links only — no embedded modules).
 */
export function RichText({ value, className }: RichTextProps) {
	if (!value.length) return null;

	return (
		<div className={clsx("rich-text w-full min-w-0", className)}>
			<PortableText
				value={value}
				components={portableTextBlockComponents()}
				onMissingComponent={false}
			/>
		</div>
	);
}
