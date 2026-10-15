/**
 * The trimmed value of a plain string field, else `fallback`. For schema `preview.prepare`
 * blocks; `main` resolves localized fields with `firstLocalizedLabel` instead.
 */
export function plainLabel(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
