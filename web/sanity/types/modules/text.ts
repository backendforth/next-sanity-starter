import type { PortableTextBlock } from "@portabletext/types";

export type ModuleTextData = {
	_type: "module.text";
	_key?: string;
	title?: string | null;
	body?: PortableTextBlock[] | null;
};
