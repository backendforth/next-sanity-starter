/**
 * Mirrors `studio/schemas/constants/references.ts` for GROQ projection.
 * Keep in sync when adding routable types to content-refs.
 */
export type ContentRefSourceScope = "all" | "pages" | "projects";

export function contentRefTypesForScope(
	scope: ContentRefSourceScope = "all",
): string[] {
	switch (scope) {
		case "pages":
			return ["home", "page"];
		case "projects":
			return ["project"];
		default:
			return ["home", "page", "project"];
	}
}

/** GROQ `_type in [...]` literal for a source scope. */
export function contentRefTypesGroqLiteral(
	scope: ContentRefSourceScope = "all",
): string {
	return JSON.stringify(contentRefTypesForScope(scope));
}
