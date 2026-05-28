import type { ModuleTextData } from "@/sanity/types/modules";
import { RichTextMedia } from "../text/RichTextMedia";

type Props = {
	module: ModuleTextData;
};

export function ModuleText({ module }: Props) {
	const title = module.title?.trim() ?? "";
	const blocks = module.body ?? [];

	return (
		<article className="flex flex-col gap-4 border-b border-color-border-subtle pb-10 last:border-b-0 last:pb-0">
			{title ? <h2>{title}</h2> : null}
			<RichTextMedia value={blocks} />
		</article>
	);
}
