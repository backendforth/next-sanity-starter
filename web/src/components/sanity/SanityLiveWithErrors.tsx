"use client";

/**
 * Error handler for `<SanityLive onError={...} />`. Defined in a `"use client"`
 * module so the function is a client reference — that's the only shape the RSC
 * boundary accepts here (`SanityLive` is rendered from the server layout, but
 * its `onError` callback runs in the browser). Wire Sentry / other telemetry
 * here if needed.
 */
export function handleSanityLiveError(
	error: unknown,
	context: { includeDrafts: boolean; waitFor: "function" | undefined },
): void {
	console.error("[SanityLive] live connection error", {
		error,
		includeDrafts: context.includeDrafts,
		waitFor: context.waitFor,
	});
}
