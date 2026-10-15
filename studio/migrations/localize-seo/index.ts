import { randomBytes } from "node:crypto";
import {
  at,
  defineMigration,
  type MigrationContext,
  type NodePatch,
  set,
  unset,
} from "sanity/migrate";

/**
 * The SEO fields (`seo.page`, `seo.fallback`) are translatable (`main`). Wraps a plain-string
 * `seo.title` / `seo.description` into one entry for the default language
 * (`siteLanguageSettings.defaultLanguageId`); an empty string is unset. Values that are already
 * arrays are skipped, so a re-run is safe. The export it reads includes drafts, so they are
 * migrated too.
 *
 * How and when to run it: `scripts/README.md` → "Content migrations".
 */

const FIELDS = {
  title: "internationalizedArrayStringValue",
  description: "internationalizedArrayTextValue",
} as const;

let defaultLanguage: Promise<string> | undefined;

function languageFor(context: MigrationContext): Promise<string> {
  defaultLanguage ??= context.client
    .fetch<{ id?: string | null; ids?: (string | null)[] | null } | null>(
      `*[_id == "siteLanguageSettings"][0]{ "id": defaultLanguageId, "ids": availableLanguages[].id }`,
    )
    .then((settings) => {
      const id = settings?.id?.trim() || settings?.ids?.find((v) => v?.trim());
      if (!id) {
        throw new Error(
          "siteLanguageSettings has no default language. Publish it in the Studio (Settings → Site languages), then run the migration again.",
        );
      }
      return id.trim();
    });
  return defaultLanguage;
}

export default defineMigration({
  title: "Translatable SEO title and description",
  /* A document with a `language` field is document-level i18n (the variant branch, in a dataset
     shared with it): its SEO texts stay plain strings. */
  filter: "!defined(language)",
  migrate: {
    async document(doc, context) {
      const seo = doc.seo as Record<string, unknown> | undefined;
      if (!seo || typeof seo !== "object") return [];
      const patches: NodePatch[] = [];
      for (const [field, valueType] of Object.entries(FIELDS)) {
        const value = seo[field];
        if (typeof value !== "string") continue;
        const text = value.trim();
        patches.push(
          at(
            ["seo", field],
            text
              ? set([
                  {
                    _key: randomBytes(16).toString("hex"),
                    _type: valueType,
                    language: await languageFor(context),
                    value: text,
                  },
                ])
              : unset(),
          ),
        );
      }
      return patches;
    },
  },
});
