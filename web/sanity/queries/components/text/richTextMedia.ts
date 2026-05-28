import { linkQuery } from "../../snippets/link";
import { moduleCarouselInnerFields } from "../modules/carousel";
import { moduleContentRefsInnerFields } from "../modules/contentRefs";
import { moduleMediaInnerFields } from "../modules/media";

/** Base case: plain blocks with resolved `link` marks (no embedded modules). */
const blockAndLinks = `
    ...,
    _type == "block" => {
      ...,
      markDefs[]{
        ...,
        _type == "link" => {
          ${linkQuery}
        }
      }
    }
  `;

/**
 * Portable Text `value[]` for schema `richTextMedia` (`objects/editors/richTextMedia.ts`):
 * blocks, `module.media`, `module.carousel`, `module.contentRefs`, and `module.text`
 * with one level of nesting (`module.text` inside `module.text`); deeper nestings fall
 * back to blocks + links only. The flat shape keeps Sanity Typegen happy.
 */
export const richTextMediaQuery = `
    ${blockAndLinks},
    _type == "module.media" => {
      ${moduleMediaInnerFields}
    },
    _type == "module.carousel" => {
      ${moduleCarouselInnerFields}
    },
    _type == "module.contentRefs" => {
      ${moduleContentRefsInnerFields}
    },
    _type == "module.text" => {
      title,
      body[]{
        ${blockAndLinks},
        _type == "module.media" => {
          ${moduleMediaInnerFields}
        },
        _type == "module.carousel" => {
          ${moduleCarouselInnerFields}
        },
        _type == "module.contentRefs" => {
          ${moduleContentRefsInnerFields}
        },
        _type == "module.text" => {
          title,
          body[]{
            ${blockAndLinks}
          }
        }
      }
    }
  `;
