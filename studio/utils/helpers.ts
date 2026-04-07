/** Shared helpers; extend as the studio grows. */
export function noop(): void {}

/** Format duration in seconds as m:ss (Mux-style metadata). */
export function getDurationString(seconds?: number | null): string {
  if (seconds == null || Number.isNaN(seconds)) {
    return "";
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
