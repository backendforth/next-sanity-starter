import {
  FALLBACK_SITE_LANGUAGES,
  normalizeSiteLanguages,
  SITE_LANGUAGES_PROJECTION,
  type SiteLanguage,
  type SiteLanguagesDocument,
} from "@repo/site-languages";
import type { SanityClient } from "sanity";

/**
 * Draft-first so a language added in Studio is offered for translations
 * immediately, before the `siteLanguageSettings` singleton is published.
 * The fetch forces the `raw` perspective: the client the plugin hands in may
 * default to `published`, which hides the `drafts.` id before GROQ runs.
 */
const SITE_LANGUAGES_QUERY = `coalesce(
  *[_id == "drafts.siteLanguageSettings"][0],
  *[_id == "siteLanguageSettings"][0]
)${SITE_LANGUAGES_PROJECTION}`;

function fetchSettings(client: SanityClient): Promise<SiteLanguagesDocument> {
  return client.fetch<SiteLanguagesDocument>(
    SITE_LANGUAGES_QUERY,
    {},
    { perspective: "raw" },
  );
}

/**
 * Languages for `@sanity/document-internationalization`, loaded on each Studio session
 * from the `siteLanguageSettings` singleton (draft preferred over published, see the
 * query above), with the row rules the web uses (`@repo/site-languages`). Falls back to
 * the minimal list when the singleton is missing or has no usable rows, or when the fetch
 * fails (Studio still boots). `defaultLanguageId` only picks a new document's language
 * (below), so a stale one never hides a configured language here.
 */
export async function supportedLanguagesFromClient(
  client: SanityClient,
): Promise<SiteLanguage[]> {
  try {
    return normalizeSiteLanguages(await fetchSettings(client));
  } catch (err) {
    console.error("[supportedLanguages] fetch failed:", err);
    return [...FALLBACK_SITE_LANGUAGES];
  }
}

/**
 * The language a document starts in when it is created outside the translation menu:
 * `defaultLanguageId` when it is one of the languages, else the first language.
 */
export async function defaultLanguageFromClient(
  client: SanityClient,
): Promise<string> {
  try {
    const doc = await fetchSettings(client);
    const languages = normalizeSiteLanguages(doc);
    const id = doc?.defaultLanguageId?.trim();
    return (
      languages.find((language) => language.id === id)?.id ?? languages[0].id
    );
  } catch (err) {
    console.error("[supportedLanguages] fetch failed:", err);
    return FALLBACK_SITE_LANGUAGES[0].id;
  }
}
