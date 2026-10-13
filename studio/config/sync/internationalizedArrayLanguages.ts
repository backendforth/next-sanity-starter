import type { SanityClient } from "sanity";

/**
 * Draft-first so a language added in Studio drives the `internationalizedArray*`
 * fields immediately, before the `siteLanguageSettings` singleton is published.
 * Reading only the published doc meant a freshly added language had no tab until
 * publish. Works under every perspective: `raw` sees the `drafts.` id, `drafts`
 * overlays it on the published id, `published` skips it.
 * Same projection as `web/sanity/queries/snippets/settings.ts` / locale codegen.
 */
export const siteLanguageSettingsInternationalizedQuery = `coalesce(
  *[_id == "drafts.siteLanguageSettings"][0],
  *[_id == "siteLanguageSettings"][0]
){availableLanguages[]{id,title},defaultLanguageId}`;

type SiteLanguageSettingsDoc = {
  availableLanguages?: Array<{ id?: string; title?: string }> | null;
  defaultLanguageId?: string | null;
} | null;

/**
 * Minimal fallback when `siteLanguageSettings` is missing or has no usable language rows.
 * **Keep in sync** with `FALLBACK_SITE_LOCALE_CONFIG` in `web/src/i18n/fallbackSiteLocales.ts`.
 */
const FALLBACK_LANGUAGES = [{ id: "en", title: "English" }] as const;

/**
 * Same row rules as `normalizeSiteLocaleConfig` in `web/sanity/` — keep in sync.
 * Only the id is required; anything short of an empty list keeps the editor's
 * languages instead of collapsing the Studio to the `en` fallback.
 */
function normalizeFromDoc(doc: SiteLanguageSettingsDoc): Array<{
  id: string;
  title: string;
}> {
  const rows = Array.isArray(doc?.availableLanguages)
    ? doc.availableLanguages
    : [];
  const normalized = rows
    .map((row) => {
      const id = typeof row?.id === "string" ? row.id.trim() : "";
      const title = typeof row?.title === "string" ? row.title.trim() : "";
      /* A row without a Label falls back to its id rather than dropping the language. */
      return { id, title: title || id };
    })
    /* First occurrence wins: the schema doesn't enforce unique ids, and drafts are unvalidated. */
    .filter(
      (row, index, all) =>
        row.id.length > 0 && all.findIndex((r) => r.id === row.id) === index,
    );

  /* `defaultLanguageId` is deliberately not checked: it only drives web routing
   * (`normalizeSiteLocaleConfig` degrades a stale one to the first language), and
   * a mismatch must not hide every configured language in the Studio. */
  return normalized.length > 0 ? normalized : [...FALLBACK_LANGUAGES];
}

/**
 * Languages for `sanity-plugin-internationalized-array`, loaded on each Studio session
 * from the `siteLanguageSettings` singleton (draft preferred over published, see the
 * query above). Falls back to the minimal `en` list when the fetch fails, so Studio still boots.
 */
export async function internationalizedArrayLanguagesFromClient(
  client: SanityClient,
): Promise<Array<{ id: string; title: string }>> {
  try {
    const doc = await client.fetch<SiteLanguageSettingsDoc>(
      siteLanguageSettingsInternationalizedQuery,
    );
    return normalizeFromDoc(doc);
  } catch (err) {
    console.error("[internationalizedArrayLanguages] fetch failed:", err);
    return [...FALLBACK_LANGUAGES];
  }
}
