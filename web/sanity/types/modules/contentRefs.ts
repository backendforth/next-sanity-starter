export type ModuleContentRefTarget = {
	_id?: string;
	_type?: "home" | "page" | string;
	title?: string | null;
	slug?: string | null;
} | null;

export type ModuleContentRefsData = {
	_type: "module.contentRefs";
	_key?: string;
	heading?: string | null;
	allowMultiple?: boolean | null;
	reference?: ModuleContentRefTarget;
	references?: Array<ModuleContentRefTarget> | null;
};
