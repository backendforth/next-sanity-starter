import { linkQuery } from "../../snippets/link";
import { moduleCarouselQuery } from "../modules/carousel";
import { moduleMediaQuery } from "../modules/media";

/** Portable Text blocks with resolved `link` marks. */
export const blockFields = `
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
 * Portable Text `value[]` for schema `richTextMedia`: blocks
 * plus the inline modules. Inline modules are opt-in, and this list must name exactly the
 * modules in the editor's `of` (`objects/editors/richTextMedia.ts`) and the `types` map in
 * `portableTextComponents.tsx` — `pnpm check:wiring` compares the three.
 */
export const richTextMediaQuery = `
    ${blockFields},
    ${moduleMediaQuery},
    ${moduleCarouselQuery}
  `;
