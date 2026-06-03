import { linkQuery } from "../../snippets/link";
import { moduleCarouselInnerFields } from "../modules/carousel";
import { moduleContentRefsInnerFields } from "../modules/contentRefs";
import { moduleMediaInnerFields } from "../modules/media";

/**
 * Portable Text `value[]` for `internationalizedArrayRichTextMedia` / `richTextMedia`
 * (`objects/editors/richTextMedia.ts`): blocks, `module.media`, `module.carousel`,
 * `module.contentRefs`, `module.text` (nested `body` up to `depth` levels).
 */
function buildRichTextMediaQuery(depth: number): string {
	if (depth <= 0) {
		return `
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
	}

	return `
    ...,
    _type == "block" => {
      ...,
      markDefs[]{
        ...,
        _type == "link" => {
          ${linkQuery}
        }
      }
    },
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
        _key,
        _type,
        language,
        value[]{
          ${buildRichTextMediaQuery(depth - 1)}
        }
      }
    }
  `;
}

/** Default nesting depth for `module.text` inside rich text (each level adds one `body[]` → `value[]`). */
export const richTextMediaQuery = buildRichTextMediaQuery(3);

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
