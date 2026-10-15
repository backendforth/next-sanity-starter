import { imageQuery } from "../../snippets/media";
import { routePathProjection } from "../../snippets/routePath";

/** One list entry: a page, the home singleton or a project, with its card preview. */
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
 * routable target of `sourceScope` (`^` is the module inside the subquery): `pages` = home and
 * pages, `projects` = projects with a title medium, `all` = both — the sets the Studio's picker
 * offers (`contentRefReferenceFilter` in `studio/schemas/constants/references.ts`). Otherwise
 * the editor's picks, in their order.
 */
export const moduleContentRefsInnerFields = `
  heading,
  sourceScope,
  showProjectFilters,
  selection,
  "references": select(
    selection == "all" => *[
      (
        ^.sourceScope != "projects" &&
        (_type == "home" || (_type == "page" && defined(slug.current)))
      ) ||
      (
        ^.sourceScope != "pages" &&
        _type == "project" && defined(slug.current) && defined(titleMedia.type)
      )
    ] | order(_updatedAt desc) {
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
