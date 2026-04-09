import { defineField } from "sanity";

/** Types allowed in document-level `modules` arrays (keep in sync with `richTextMedia` block types). */
export const documentModuleTypes = [
	{ type: "module.media" },
	{ type: "module.carousel" },
	{ type: "module.contentRefs" },
	{ type: "module.text" },
] as const;

type ModulesArrayOptions = {
	/** Sanity field group name (e.g. `editorial`, `site`). Omit to place in the default group. */
	group?: string;
};

/**
 * Reusable field: ordered stack of modules on pages and content singletons.
 */
export function modulesArrayField(options?: ModulesArrayOptions) {
	return defineField({
		name: "modules",
		title: "Modules",
		description:
			"Content modules to be displayed on the page. Add any number; order is used on the frontend.",
		type: "array",
		...(options?.group ? { group: options.group } : {}),
		of: [...documentModuleTypes],
	});
}
