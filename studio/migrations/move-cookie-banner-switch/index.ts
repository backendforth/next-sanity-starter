import {
  at,
  createIfNotExists,
  defineMigration,
  type MigrationContext,
  type Mutation,
  patch,
  setIfMissing,
  unset,
} from "sanity/migrate";

/**
 * `useCookieBanner` lives in `siteAnalyticsSettings`, next to the trackers it gates, and covers
 * every language. The banner exists once per language here; the default language's published
 * banner (`siteLanguageSettings.defaultLanguageId`) decides. Its value goes onto the analytics
 * singleton (and its draft, so publishing the draft keeps it), unless the field is set there
 * already, and the field is unset on every language's banner and its draft. A banner whose
 * switch differs from the moved one is reported. A banner without a `language` is `main`'s
 * fixed-id singleton in a shared dataset and is left to `main`'s migration. A re-run finds
 * nothing to move.
 *
 * How and when to run it: `scripts/README.md` → "Content migrations".
 */

const BANNER = "siteCookieBanner";
const ANALYTICS = "siteAnalyticsSettings";

type Source = { id: string | null; value: boolean | undefined };

let source: Promise<Source> | undefined;

/** The default language's published banner: its id and switch. */
function defaultBanner(context: MigrationContext): Promise<Source> {
  source ??= context.client
    .fetch<{
      language?: string | null;
      banner?: { _id: string; useCookieBanner?: unknown } | null;
    }>(
      `{
        "language": *[_id == "siteLanguageSettings"][0].defaultLanguageId,
        "banner": *[
          _type == "${BANNER}" &&
          language == *[_id == "siteLanguageSettings"][0].defaultLanguageId &&
          !(_id in path("drafts.**")) && !(_id in path("versions.**"))
        ] | order(_createdAt asc)[0]{ _id, useCookieBanner }
      }`,
    )
    .then(({ language, banner }) => {
      if (!language?.trim()) {
        throw new Error(
          "siteLanguageSettings has no default language. Publish it in the Studio (Settings → Site languages), then run the migration again.",
        );
      }
      const value = banner?.useCookieBanner;
      return {
        id: banner?._id ?? null,
        value: typeof value === "boolean" ? value : undefined,
      };
    });
  return source;
}

export default defineMigration({
  title: "Cookie banner switch → Analytics & Tracking",
  documentTypes: [BANNER, ANALYTICS],
  filter: `_id in ["${ANALYTICS}", "drafts.${ANALYTICS}"] || (_type == "${BANNER}" && defined(language) && !(_id in path("versions.**")))`,
  migrate: {
    async document(doc, context) {
      const { id, value } = await defaultBanner(context);

      if (doc._type === ANALYTICS) {
        return doc.useCookieBanner === undefined && value !== undefined
          ? at("useCookieBanner", setIfMissing(value))
          : [];
      }

      if (doc.useCookieBanner === undefined) return [];
      if (doc._id !== id && doc.useCookieBanner !== value) {
        console.warn(
          `[${doc._id}] This banner's switch (${String(doc.useCookieBanner)}) differs from the default language's published one (${String(value)}), which is the one moved and now covers every language. Set it under Analytics & Tracking.`,
        );
      }
      const mutations: Mutation[] = [];
      /* No analytics document to patch: an on switch needs one, an off switch is its absence. */
      if (
        doc._id === id &&
        value === true &&
        !(await context.filtered.getDocument(ANALYTICS))
      ) {
        mutations.push(
          createIfNotExists({
            _id: ANALYTICS,
            _type: ANALYTICS,
            useCookieBanner: true,
          }),
        );
      }
      mutations.push(patch(doc._id, at("useCookieBanner", unset())));
      return mutations;
    },
  },
});
