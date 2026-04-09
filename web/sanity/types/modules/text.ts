import type { IntlRichTextEntry, IntlStringEntry } from "@/sanity/utils";

export type ModuleTextData = {
	_type: "module.text";
	_key?: string;
	title?: IntlStringEntry[] | null;
	body?: IntlRichTextEntry[] | null;
};
