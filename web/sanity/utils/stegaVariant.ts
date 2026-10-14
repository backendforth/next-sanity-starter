import { type StegaString, stegaClean } from "next-sanity";

/**
 * Narrows a union on a string field that may carry stega markers in Presentation, e.g.
 * `isStegaVariant(media, "kind", "loop")`. Compares the clean value and leaves the object as
 * it is, so its strings keep the markers the click-to-edit overlays read.
 */
export function isStegaVariant<
	T extends object,
	K extends keyof T,
	const V extends string,
>(
	value: T,
	key: K,
	variant: V,
): value is Extract<T, { [P in K]: V | StegaString<V> }> {
	return stegaClean(value[key]) === variant;
}
