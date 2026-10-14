import { routePathProjection } from "./routePath";

/**
 * Every language variant of the current document as `{ language, path }`,
 * the document itself included. Slugs differ per language, so this — not the
 * current path — feeds `hreflang` alternates and the language switch.
 *
 * - `page` / `project`: linked through the `translation.metadata` document
 *   that `@sanity/document-internationalization` maintains.
 * - `home` / `work`: one singleton per language, found by type.
 *
 * Variants that are unpublished (or deleted) resolve to `null` — callers drop
 * entries without a `language` or `path`.
 */
export const translationsQuery = `"translations": select(
  _type in ["home", "work"] => *[_type == ^._type && defined(language)]{
    language,
    "path": ${routePathProjection}
  },
  *[_type == "translation.metadata" && references(^._id)][0].translations[].value->{
    language,
    "path": ${routePathProjection}
  }
)`;
