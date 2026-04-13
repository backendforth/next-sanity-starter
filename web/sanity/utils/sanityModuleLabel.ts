const SANITY_MODULE_LABELS: Record<string, string> = {
	"module.text": "module__text",
	"module.media": "module__media",
	"module.carousel": "module__carousel",
	"module.contentRefs": "module__content-refs",
};

function humanizeModuleType(moduleType: string): string {
	return moduleType
		.replace(/^module\./, "")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.trim();
}

export function getSanityModuleLabel(moduleType: string | undefined): string {
	if (!moduleType) {
		return "Module";
	}
	return (
		SANITY_MODULE_LABELS[moduleType] ??
		(humanizeModuleType(moduleType) || "Module")
	);
}
