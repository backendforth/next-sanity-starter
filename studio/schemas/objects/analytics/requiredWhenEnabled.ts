import type { CustomValidator } from "sanity";

/**
 * A tracker field the provider needs to load. `enabled` is opt-out — the web and the analytics
 * settings count a tracker without it as on — so only an explicit `false` skips the check.
 * `check` validates a filled-in value further.
 */
export function requiredWhenEnabled(
  label: string,
  check?: (value: string) => string | true,
): CustomValidator<string | undefined> {
  return (value, context) => {
    const tracker = context.parent as { enabled?: boolean } | undefined;
    if (tracker?.enabled === false) return true;
    const trimmed = value?.trim();
    if (!trimmed) return `${label} is required when enabled.`;
    return check ? check(trimmed) : true;
  };
}
