import { imageQuery } from "../../snippets/media";
import { routePathProjection } from "../../snippets/routePath";

/**
 * One list entry: a page, the home singleton or a project, with its card preview. Document-level
 * i18n: every target is a document of the active locale, so `title` / `slug` are plain values.
 */
const contentRefTargetProjection = `
  _id,
  _type,
  _createdAt,
  title,
  "slug": slug.current,
  "path": ${routePathProjection},
  "previewImage": select(
    _type != "project" => null,
    titleMedia.type == "image" => titleMedia.imageContent.image${imageQuery},
    titleMedia.type == "video" => titleMedia.videoContent.poster${imageQuery},
    titleMedia.type == "loop" => titleMedia.videoLoopContent.poster${imageQuery}
  ),
  categories[]->{
    _id,
    title
  }
`;

/**
 * `module.contentRefs` (`objects/modules/moduleContentRefs.ts`). `selection == "all"` lists every
 * routable target of `sourceScope` in `$locale` (`^` is the module inside the subquery):
 * `pages` = home and pages, `projects` = projects, `all` = both — the sets the Studio's picker
 * offers (`contentRefReferenceFilter` in `studio/schemas/constants/references.ts`), newest first.
 * Otherwise the editor's picks, in their order. The visitor's sort controls start from this.
 */
export const moduleContentRefsInnerFields = `
  heading,
  sourceScope,
  showProjectFilters,
  "references": select(
    selection == "all" => *[
      language == $locale && (
        (
          ^.sourceScope != "projects" &&
          (_type == "home" || (_type == "page" && defined(slug.current)))
        ) ||
        (
          ^.sourceScope != "pages" &&
          _type == "project" && defined(slug.current)
        )
      )
    ] | order(_createdAt desc) {
      ${contentRefTargetProjection}
    },
    references[]->{
      ${contentRefTargetProjection}
    }
  )
`;

export const moduleContentRefsQuery = `_type == "module.contentRefs" => {
  ${moduleContentRefsInnerFields}
}`;
