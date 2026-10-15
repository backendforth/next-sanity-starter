import { linkQuery } from "../../snippets/link";
import { moduleCarouselQuery } from "../modules/carousel";
import { moduleMediaQuery } from "../modules/media";

/** Portable Text blocks with resolved `link` marks. Inline modules add their own fields below. */
export const blockFields = `
    _key,
    _type,
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
 * The blocks of a `richTextMedia` field: text blocks plus the inline modules. Inline modules
 * are opt-in, and this list must name exactly the modules in the editor's `of`
 * (`objects/editors/richTextMedia.ts`) and the `types` map in `portableTextComponents.tsx` —
 * `pnpm check:wiring` compares the three.
 */
export const richTextMediaQuery = `
    ${blockFields},
    ${moduleMediaQuery},
    ${moduleCarouselQuery}
  `;

/** A `body` field of schema `richTextMedia` (`module.text`, `project`). */
export const richTextMediaBodyQuery = `
  body[]{
    ${richTextMediaQuery}
  }
`;
