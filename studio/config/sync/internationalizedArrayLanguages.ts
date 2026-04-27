import type { SanityClient } from "sanity";

/** Same projection as `web/sanity/queries/snippets/settings.ts` / locale codegen. */
export const siteLanguageSettingsInternationalizedQuery = `*[_id == "siteLanguageSettings"][0]{availableLanguages[]{id,title},defaultLanguageId}`;

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
 * Languages for `sanity-plugin-internationalized-array`, loaded on each Studio session
 * from the `siteLanguageSettings` singleton (drafts when the Studio client uses preview).
 */
export async function internationalizedArrayLanguagesFromClient(
  client: SanityClient,
): Promise<Array<{ id: string; title: string }>> {
  const doc = await client.fetch<SiteLanguageSettingsDoc>(
    siteLanguageSettingsInternationalizedQuery,
  );
  return normalizeFromDoc(doc);
}
