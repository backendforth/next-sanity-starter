import {
	type ContentRefSourceScope,
	contentRefTypesGroqLiteral,
} from "@/sanity/constants/contentRefs";
import { imageQuery } from "../../snippets/media";

/**
 * `module.contentRefs` (`objects/modules/moduleContentRefs.ts`).
 */
const contentRefTargetProjection = `
  _id,
  _type,
  _createdAt,
  title,
  "slug": slug.current,
  "route": select(
    _type == "home" => "index",
    _type == "project" => "project",
    "slug"
  ),
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

function allReferencesProjection(sourceScope: ContentRefSourceScope) {
	const types = contentRefTypesGroqLiteral(sourceScope);
	return `*[_type in ${types} && (
    _type == "home" ||
    (_type == "page" && defined(slug.current)) ||
    (_type == "project" && defined(slug.current) && defined(titleMedia.type))
  )] | order(_updatedAt desc) {
    ${contentRefTargetProjection}
  }`;
}

export const moduleContentRefsInnerFields = `
  heading,
  sourceScope,
  showProjectFilters,
  selection,
  "references": select(
    selection == "all" => select(
      sourceScope == "pages" => ${allReferencesProjection("pages")},
      sourceScope == "projects" => ${allReferencesProjection("projects")},
      ${allReferencesProjection("all")}
    ),
    references[]->{
      ${contentRefTargetProjection}
    }
  )
`;

export const moduleContentRefsQuery = `_type == "module.contentRefs" => {
  ${moduleContentRefsInnerFields}
}`;
