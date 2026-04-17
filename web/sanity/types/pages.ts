/**
 * Document shapes for route-level GROQ (see queries/pages/).
 * Import in app route pages next to cachedHomeDocument / cachedPageDocumentBySlug —
 * types live here; fetches stay deduped per request via React cache.
 */
import type { IntlStringEntry } from "../utils";
import type { ContentModule } from "./modules";

/** Resolved seo / seo.fallback projection from GROQ (snippets/seo.ts). */
export type PageSeo = {
	title?: string | null;
	description?: string | null;
	imageUrl?: string | null;
} | null;

export type HomeDocument = {
	_id: string;
	title?: IntlStringEntry[] | null;
	modules?: ContentModule[] | null;
	seo?: PageSeo;
	/** From siteSettings — merge with resolveSanityMetadata for fallback SEO. */
	settingsSeo?: PageSeo;
};

export type PageDocument = {
	_id: string;
	title?: IntlStringEntry[] | null;
	slug?: { current?: string | null } | null;
	modules?: ContentModule[] | null;
	seo?: PageSeo;
	settingsSeo?: PageSeo;
};
