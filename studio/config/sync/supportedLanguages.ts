import type { SanityClient } from "sanity";

/** Same projection as `web/sanity/queries/snippets/settings.ts` (siteLanguageSettings). */
export const siteLanguageSettingsLanguagesQuery = `*[_id == "siteLanguageSettings"][0]{availableLanguages[]{id,title},defaultLanguageId}`;

type SiteLanguageSettingsDoc = {
  availableLanguages?: Array<{ id?: string; title?: string }> | null;
  defaultLanguageId?: string | null;
} | null;

/**
 * Minimal fallback when `siteLanguageSettings` is missing or invalid.
 * **Keep in sync** with `FALLBACK_SITE_LOCALE_CONFIG` in `web/src/i18n/fallbackSiteLocales.ts`.
 */
const FALLBACK_LANGUAGES = [{ id: "en", title: "English" }] as const;

function normalizeFromDoc(doc: SiteLanguageSettingsDoc): Array<{
  id: string;
  title: string;
}> {
  const rows = Array.isArray(doc?.availableLanguages)
    ? doc.availableLanguages
    : [];
  const normalized = rows
    .map((row) => ({
      id: typeof row?.id === "string" ? row.id.trim() : "",
      title: typeof row?.title === "string" ? row.title.trim() : "",
    }))
    .filter((row) => row.id.length > 0 && row.title.length > 0);

  const defaultId =
    typeof doc?.defaultLanguageId === "string"
      ? doc.defaultLanguageId.trim()
      : "";

  if (
    normalized.length === 0 ||
    !defaultId ||
    !normalized.some((r) => r.id === defaultId)
  ) {
    return [...FALLBACK_LANGUAGES];
  }
  return normalized;
}

/**
 * Languages for `@sanity/document-internationalization`, loaded on each Studio session
 * from the `siteLanguageSettings` singleton. Falls back to the minimal `en` list when
 * the singleton is missing or malformed (Studio still boots).
 */
export async function supportedLanguagesFromClient(
  client: SanityClient,
): Promise<Array<{ id: string; title: string }>> {
  try {
    const doc = await client.fetch<SiteLanguageSettingsDoc>(
      siteLanguageSettingsLanguagesQuery,
    );
    return normalizeFromDoc(doc);
  } catch (err) {
    console.error("[supportedLanguages] fetch failed:", err);
    return [...FALLBACK_LANGUAGES];
  }
}
