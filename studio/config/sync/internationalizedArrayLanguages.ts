import {
  FALLBACK_SITE_LANGUAGES,
  normalizeSiteLanguages,
  SITE_LANGUAGES_PROJECTION,
  type SiteLanguage,
  type SiteLanguagesDocument,
} from "@repo/site-languages";
import type { SanityClient } from "sanity";

/**
 * Draft-first so a language added in Studio drives the `internationalizedArray*`
 * fields immediately, before the `siteLanguageSettings` singleton is published.
 * The fetch forces the `raw` perspective: the client the plugin hands in may
 * default to `published`, which hides the `drafts.` id before GROQ runs.
 */
const SITE_LANGUAGES_QUERY = `coalesce(
  *[_id == "drafts.siteLanguageSettings"][0],
  *[_id == "siteLanguageSettings"][0]
)${SITE_LANGUAGES_PROJECTION}`;

/**
 * Languages for `sanity-plugin-internationalized-array`, loaded on each Studio session
 * from the `siteLanguageSettings` singleton (draft preferred over published, see the
 * query above), with the row rules the web uses (`@repo/site-languages`). Falls back to
 * the minimal list when the singleton is missing or has no usable rows, or when the fetch
 * fails (Studio still boots). `defaultLanguageId` only drives web routing, so a stale one
 * never hides a configured language here.
 */
export async function internationalizedArrayLanguagesFromClient(
  client: SanityClient,
): Promise<SiteLanguage[]> {
  try {
    const doc = await client.fetch<SiteLanguagesDocument>(
      SITE_LANGUAGES_QUERY,
      {},
      { perspective: "raw" },
    );
    return normalizeSiteLanguages(doc);
  } catch (err) {
    console.error("[internationalizedArrayLanguages] fetch failed:", err);
    return [...FALLBACK_SITE_LANGUAGES];
  }
}
