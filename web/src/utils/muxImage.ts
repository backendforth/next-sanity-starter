/**
 * Mux video payload from Sanity (`videoQuery`) — resolve `playbackId`, display size and
 * `image.mux.com` thumbnail URLs. Image and poster code (`MediaImage`, `mediaImageSource`)
 * sits on the eager LCP path, so it imports only this file, never the HLS code in
 * `muxPlayback.ts`.
 */

/** `playbackId` of a `videoQuery` payload (GROQ already falls back to `playback_ids`). */
export function extractMuxPlaybackId(media: unknown): string | null {
	if (!media || typeof media !== "object" || !("playbackId" in media)) {
		return null;
	}
	const { playbackId } = media;
	return typeof playbackId === "string" && playbackId.length > 0
		? playbackId
		: null;
}

/**
 * `image.mux.com` thumbnail as WebP — about a third of the JPG's bytes. Mux delivers both
 * untagged (no ICC profile), so the browser treats both as sRGB and the format cannot shift
 * colour. `widthPx` is the output width (`mediaImageSource` caps it); Mux downscales from
 * source.
 */
export function muxThumbnailUrl(
	playbackId: string,
	timeSec: number | undefined,
	widthPx: number,
): string {
	const u = new URL(`https://image.mux.com/${playbackId}/thumbnail.webp`);
	/* No `time`: Mux picks its default frame, not the (often black) first one. */
	if (timeSec !== undefined) u.searchParams.set("time", String(timeSec));
	if (widthPx > 0) {
		u.searchParams.set("width", String(Math.round(widthPx)));
	}
	return u.toString();
}

/**
 * Prefer Mux `asset.data.tracks` video dimensions; otherwise `isFallback` + 16:9 for `aspect-ratio`.
 */
export function getMuxDisplayDimensions(media: unknown): {
	width: number;
	height: number;
	isFallback: boolean;
} {
	const fallback = { width: 16, height: 9, isFallback: true as const };
	if (!media || typeof media !== "object") {
		return fallback;
	}
	const m = media as Record<string, unknown>;
	const asset = m.asset;
	if (!asset || typeof asset !== "object") {
		return fallback;
	}
	const data = (asset as Record<string, unknown>).data;
	if (!data || typeof data !== "object") {
		return fallback;
	}
	const tracks = (data as Record<string, unknown>).tracks;
	if (!Array.isArray(tracks)) {
		return fallback;
	}
	for (const t of tracks) {
		if (!t || typeof t !== "object") continue;
		const tr = t as { type?: string; max_width?: number; max_height?: number };
		if (tr.type !== "video") continue;
		if (
			typeof tr.max_width === "number" &&
			typeof tr.max_height === "number" &&
			tr.max_width > 0 &&
			tr.max_height > 0
		) {
			return {
				width: tr.max_width,
				height: tr.max_height,
				isFallback: false,
			};
		}
	}
	return fallback;
}

/**
 * Mux `asset.thumbTime` — the time (in seconds) selected in Studio for the poster frame.
 */
export function muxThumbnailTimeSec(media: unknown): number | undefined {
	if (!media || typeof media !== "object") return undefined;
	const asset = (media as Record<string, unknown>).asset;
	if (!asset || typeof asset !== "object") return undefined;
	const t = (asset as Record<string, unknown>).thumbTime;
	return typeof t === "number" ? t : undefined;
}
