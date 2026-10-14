import type { SlugSourceFn } from "sanity";

import { firstLocalizedLabel } from "./firstLocalizedLabel";

/**
 * Slug `options.source` for documents whose `title` is an
 * `internationalizedArrayString`: the first non-empty localized title, so the
 * slug field's "Generate" button works. A plain `source: "title"` would point
 * at the array, not at a string.
 */
export const titleSlugSource: SlugSourceFn = (document) =>
  firstLocalizedLabel(document.title, "");
