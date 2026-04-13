import type { ModuleTextData } from "@/sanity/types/modules";
import {
	pickLocalizedPortableTextBlocks,
	pickLocalizedString,
} from "@/sanity/utils";
import { defaultLocale } from "@/src/i18n/config";
import { RichTextMedia } from "../text/RichTextMedia";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
	module: ModuleTextData;
	locale?: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ModuleText({ module, locale = defaultLocale }: Props) {
	const title = pickLocalizedString(module.title, locale);
	const blocks = pickLocalizedPortableTextBlocks(module.body, locale);

	return (
		<article className="flex flex-col gap-4 border-b border-color-border-subtle pb-10 last:border-b-0 last:pb-0">
			{title ? <h2>{title}</h2> : null}
			<RichTextMedia value={blocks} />
		</article>
	);
}
