import {
  at,
  createIfNotExists,
  defineMigration,
  type Mutation,
  patch,
  setIfMissing,
  unset,
} from "sanity/migrate";

/**
 * `useCookieBanner` lives in `siteAnalyticsSettings`, next to the trackers it gates. Copies the
 * published banner's value onto the analytics singleton (and its draft, so publishing the draft
 * keeps it), unless the field is set there already, and unsets it on the banner and its draft.
 * Only the fixed-id singletons are touched. A re-run finds nothing to move.
 *
 * How and when to run it: `scripts/README.md` → "Content migrations".
 */

const BANNER = "siteCookieBanner";
const ANALYTICS = "siteAnalyticsSettings";

export default defineMigration({
  title: "Cookie banner switch → Analytics & Tracking",
  documentTypes: [BANNER, ANALYTICS],
  filter: `_id in ["${BANNER}", "drafts.${BANNER}", "${ANALYTICS}", "drafts.${ANALYTICS}"]`,
  migrate: {
    async document(doc, context) {
      const banner = await context.filtered.getDocument(BANNER);
      const value = banner?.useCookieBanner;

      if (doc._type === ANALYTICS) {
        return doc.useCookieBanner === undefined && typeof value === "boolean"
          ? at("useCookieBanner", setIfMissing(value))
          : [];
      }

      if (doc.useCookieBanner === undefined) return [];
      if (doc._id !== BANNER && doc.useCookieBanner !== value) {
        console.warn(
          `[${doc._id}] The draft's cookie banner switch (${String(doc.useCookieBanner)}) differs from the published one, which is the one moved. Set it under Analytics & Tracking.`,
        );
      }
      const mutations: Mutation[] = [];
      /* No analytics document to patch: an on switch needs one, an off switch is its absence. */
      if (
        doc._id === BANNER &&
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
