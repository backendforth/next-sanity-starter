/**
 * Returns the first non-empty value of an `internationalizedArrayString` field
 * (array of `{ _key, value }` entries), trimmed — otherwise `fallback`.
 *
 * Used in schema `preview.prepare` blocks to derive a human label from a
 * localized heading/title without committing to a specific locale.
 */
export function firstLocalizedLabel(
  entries: unknown,
  fallback: string,
): string {
  if (!Array.isArray(entries)) {
    return fallback;
  }
  const first = entries.find(
    (entry: { value?: unknown }) =>
      typeof entry?.value === "string" && entry.value.trim().length > 0,
  );
  return first && typeof first.value === "string"
    ? first.value.trim()
    : fallback;
}
