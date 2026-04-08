import type { PortableTextBlock } from "@portabletext/types";

export type IntlRichTextEntry = {
  _key?: string;
  _type?: string;
  language?: string;
  value?: PortableTextBlock[] | null;
};

/**
 * Picks Portable Text blocks for a locale from `internationalizedArrayRichText*` fields.
 * Prefers `language` (sanity-plugin-internationalized-array v5), then `_key`, then first non-empty.
 */
export function pickLocalizedPortableTextBlocks(
  entries: IntlRichTextEntry[] | null | undefined,
  locale = "en",
): PortableTextBlock[] {
  if (!Array.isArray(entries)) return [];
  const preferred = entries.find(
    (e) =>
      (e.language === locale || e._key === locale) &&
      Array.isArray(e.value) &&
      e.value.length > 0,
  );
  if (preferred?.value?.length) return preferred.value;
  const first = entries.find((e) => Array.isArray(e.value) && e.value.length > 0);
  return first?.value ?? [];
}
