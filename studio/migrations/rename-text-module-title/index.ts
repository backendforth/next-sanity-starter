import { at, defineMigration, set, unset } from "sanity/migrate";

/**
 * `module.text` calls its heading `heading`, like `module.carousel` and `module.contentRefs`.
 * Moves a text module's `title` to `heading`, wherever the module sits. The value keeps its
 * shape, so the same migration runs on both branches. A module that already has a `heading` is
 * skipped, so a re-run is safe. The export it reads includes drafts, so they are migrated too.
 *
 * How and when to run it: `scripts/README.md` → "Content migrations".
 */
export default defineMigration({
  title: "Text module: title → heading",
  migrate: {
    object(node) {
      if (node._type !== "module.text" || node.title === undefined) return;
      if (node.heading !== undefined) return;
      return [at("heading", set(node.title)), at("title", unset())];
    },
  },
});
