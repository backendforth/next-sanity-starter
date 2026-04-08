export type IntlStringEntry = {
  _key?: string;
  value?: string | null;
};

/**
 * Resolves a value from `sanity-plugin-internationalized-array` string fields.
 * Matches studio default language (`en` in `studio/schemas/constants/languages.ts`).
 */
export function pickLocalizedString(
  entries: IntlStringEntry[] | null | undefined,
  locale = "en",
): string | undefined {
  if (!Array.isArray(entries)) return undefined;
  const preferred = entries.find(
    (e) => e._key === locale && typeof e.value === "string" && e.value.trim(),
  );
  if (preferred?.value) return preferred.value.trim();
  const first = entries.find(
    (e) => typeof e.value === "string" && e.value.trim().length > 0,
  );
  return first?.value?.trim();
}
