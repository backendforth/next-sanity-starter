import { linkQuery } from "../../snippets/link";
import { moduleCarouselInnerFields } from "../modules/carousel";
import { moduleMediaInnerFields } from "../modules/media";

/** Portable Text blocks with resolved `link` marks. */
const blockFields = `
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
 * Portable Text `value[]` for `internationalizedArrayRichTextMedia` / `richTextMedia`.
 *
 * The editor's `of` is `[block, module.media, module.carousel]`
 * (`objects/editors/richTextMedia.ts`), and `portableTextComponents.tsx` renders exactly
 * those, so a rich-text body never holds `module.text` or `module.contentRefs`. The
 * projection is flat: the recursive `module.text` branch and the contentRefs projection
 * were unreachable query text, POSTed twice per `sanityFetch`.
 */
export const richTextMediaQuery = `
    ${blockFields},
    _type == "module.media" => {
      ${moduleMediaInnerFields}
    },
    _type == "module.carousel" => {
      ${moduleCarouselInnerFields}
    }
  `;

/** i18n wrapper for a document-level `body` field using `internationalizedArrayRichTextMedia`. */
export const internationalizedRichTextMediaBodyQuery = `
  body[]{
    _key,
    _type,
    language,
    value[]{
      ${richTextMediaQuery}
    }
  }
`;
