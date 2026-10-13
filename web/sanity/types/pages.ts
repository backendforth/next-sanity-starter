/**
 * Document shapes for route-level GROQ (see queries/pages/).
 * Import in app route pages next to fetchHomeDocument / fetchPageBySlug (`fetchSanityData`) —
 * types live here; fetches stay deduped per request via React cache.
 */
import type { IntlRichTextEntry, IntlStringEntry } from "../utils";
import type { ContentModule, ModuleMediaData } from "./modules";

/**
 * Resolved seo / seo.fallback projection from GROQ (snippets/seo.ts). Title
 * and description are `internationalizedArray*` — resolve them per locale in
 * `resolveSanityMetadata`. A plain string is pre-migration data
 * (`pnpm --filter studio migrate:seo-i18n`) and is used as-is for every locale.
 */
export type PageSeo = {
	title?: IntlStringEntry[] | string | null;
	description?: IntlStringEntry[] | string | null;
	imageUrl?: string | null;
} | null;

export type HomeDocument = {
	_id: string;
	title?: IntlStringEntry[] | null;
	modules?: ContentModule[] | null;
	seo?: PageSeo;
};

export type PageDocument = {
	_id: string;
	title?: IntlStringEntry[] | null;
	slug?: { current?: string | null } | null;
	modules?: ContentModule[] | null;
	seo?: PageSeo;
};

export type WorkDocument = {
	_id: string;
	title?: IntlStringEntry[] | null;
	modules?: ContentModule[] | null;
	seo?: PageSeo;
};

export type ProjectDocument = {
	_id: string;
	title?: IntlStringEntry[] | null;
	titleMedia?: ModuleMediaData | null;
	slug?: { current?: string | null } | null;
	body?: IntlRichTextEntry[] | null;
	seo?: PageSeo;
};
