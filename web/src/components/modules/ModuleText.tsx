import type { ModuleTextData } from "@/sanity/types/modules";
import { RichTextMedia } from "@/src/components/text/RichTextMedia";

import { moduleHeadingClassName, moduleSectionClassName } from "./moduleStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	module: ModuleTextData;
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `module.text` — optional title + rich text body (with embedded modules).
 * Document-level i18n: fields are plain values (document is in one locale).
 */
export function ModuleText({ module }: Props) {
	const title = typeof module.title === "string" ? module.title.trim() : "";
	const blocks = module.body ?? [];

	return (
		<article className={moduleSectionClassName}>
			{title ? <h2 className={moduleHeadingClassName}>{title}</h2> : null}
			<RichTextMedia value={blocks} />
		</article>
	);
}
