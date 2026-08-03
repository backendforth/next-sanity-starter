import { linkQuery } from "../../snippets/link";
import { moduleCarouselInnerFields } from "../modules/carousel";
import { moduleContentRefsInnerFields } from "../modules/contentRefs";
import { moduleMediaInnerFields } from "../modules/media";

/** Portable Text blocks with resolved `link` marks — the per-level base projection. */
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
 * Portable Text `value[]` for `internationalizedArrayRichTextMedia` / `richTextMedia`
 * (`objects/editors/richTextMedia.ts`): blocks, `module.media`, `module.carousel`,
 * `module.contentRefs`, `module.text` (nested `body` up to `depth` levels).
 *
 * The media/carousel/contentRefs projections are embedded **only at the top
 * level**. Repeating them per nesting level multiplied the query text by the
 * depth (~19 KB of module projections × 3 levels ≈ 57 KB for this snippet
 * alone, ~77 KB per page query — always POSTed, twice per `sanityFetch`).
 * Nested `module.text` bodies keep resolving blocks + links through all
 * `depth` levels; media modules embedded *inside a nested text module* arrive
 * with their raw stored fields only (no asset/reference expansion) and are
 * not expected to render — treat top-level rich text as the module surface.
 */
function buildRichTextMediaQuery(depth: number, top = true): string {
	if (depth <= 0) {
		return blockFields;
	}

	const moduleFields = top
		? `
    _type == "module.media" => {
      ${moduleMediaInnerFields}
    },
    _type == "module.carousel" => {
      ${moduleCarouselInnerFields}
    },
    _type == "module.contentRefs" => {
      ${moduleContentRefsInnerFields}
    },`
		: "";

	return `
    ${blockFields},${moduleFields}
    _type == "module.text" => {
      title,
      body[]{
        _key,
        _type,
        language,
        value[]{
          ${buildRichTextMediaQuery(depth - 1, false)}
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
