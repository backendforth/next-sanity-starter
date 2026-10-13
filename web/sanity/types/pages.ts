/**
 * Document shapes for route-level GROQ (see queries/pages/).
 * Import in app route pages next to fetchHomeDocument / fetchPageBySlug (`fetchSanityData`) —
 * types live here; fetches stay deduped per request via React cache.
 */
import type { PortableTextBlock } from "@portabletext/types";
import type { ContentModule, ModuleMediaData } from "./modules";

/** Resolved seo / seo.fallback projection from GROQ (snippets/seo.ts). */
export type PageSeo = {
	title?: string | null;
	description?: string | null;
	imageUrl?: string | null;
} | null;

/** One language variant of a route document (`translationsQuery`). */
export type DocumentTranslation = {
	language?: string | null;
	/** Route path without the locale prefix (`/`, `/work`, `/about`, `/work/x`). */
	path?: string | null;
} | null;

export type HomeDocument = {
	_id: string;
	language?: string | null;
	title?: string | null;
	modules?: ContentModule[] | null;
	seo?: PageSeo;
	/** Every published language variant, this document included. */
	translations?: DocumentTranslation[] | null;
};

export type PageDocument = {
	_id: string;
	language?: string | null;
	title?: string | null;
	slug?: { current?: string | null } | null;
	modules?: ContentModule[] | null;
	seo?: PageSeo;
	/** Every published language variant, this document included. */
	translations?: DocumentTranslation[] | null;
};

export type WorkDocument = {
	_id: string;
	language?: string | null;
	title?: string | null;
	modules?: ContentModule[] | null;
	seo?: PageSeo;
	/** Every published language variant, this document included. */
	translations?: DocumentTranslation[] | null;
};

export type ProjectDocument = {
	_id: string;
	language?: string | null;
	title?: string | null;
	titleMedia?: ModuleMediaData | null;
	slug?: { current?: string | null } | null;
	body?: PortableTextBlock[] | null;
	seo?: PageSeo;
	/** Every published language variant, this document included. */
	translations?: DocumentTranslation[] | null;
};
