import type { IntlStringEntry } from "@/sanity/utils";
import type { SanityImageField } from "./shared";

export type ContentRefRoute = "index" | "slug" | "project";

export type ModuleContentRefCategory = {
	_id?: string;
	title?: IntlStringEntry[] | null;
} | null;

export type ModuleContentRefTarget = {
	_id?: string;
	_type?: "home" | "page" | "project" | string;
	_createdAt?: string | null;
	title?: IntlStringEntry[] | null;
	slug?: string | null;
	route?: ContentRefRoute | null;
	/** Project `titleMedia` — image or video/loop poster for list previews. */
	previewImage?: SanityImageField | null;
	categories?: Array<ModuleContentRefCategory> | null;
} | null;

/** Content-ref row with locale-aware href resolved on the server. */
export type ModuleContentRefListItem = NonNullable<ModuleContentRefTarget> & {
	href: string | null;
};

export type ModuleContentRefsData = {
	_type: "module.contentRefs";
	_key?: string;
	heading?: IntlStringEntry[] | null;
	sourceScope?: "all" | "pages" | "projects" | null;
	selection?: "all" | "selected" | null;
	showProjectFilters?: boolean | null;
	references?: Array<ModuleContentRefTarget> | null;
};
