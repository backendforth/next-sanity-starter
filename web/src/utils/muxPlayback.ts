/** Mux asset / `mediaQuery` video payload from Sanity — resolve `playbackId` and display size. */

export function extractMuxPlaybackId(media: unknown): string | null {
	if (!media || typeof media !== "object") return null;
	const m = media as Record<string, unknown>;
	if (typeof m.playbackId === "string" && m.playbackId.length > 0) {
		return m.playbackId;
	}
	const asset = m.asset;
	if (!asset || typeof asset !== "object") return null;
	const a = asset as Record<string, unknown>;
	if (typeof a.playbackId === "string" && a.playbackId.length > 0) {
		return a.playbackId;
	}
	const data = a.data;
	if (!data || typeof data !== "object") return null;
	const d = data as Record<string, unknown>;
	if (typeof d.playbackId === "string" && d.playbackId.length > 0) {
		return d.playbackId;
	}
	const ids = d.playback_ids;
	if (Array.isArray(ids) && ids[0] && typeof ids[0] === "object") {
		const id = (ids[0] as { id?: string }).id;
		if (typeof id === "string" && id.length > 0) return id;
	}
	return null;
}

export function muxThumbnailUrl(playbackId: string, timeSec = 0): string {
	return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${timeSec}`;
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

export function muxPlayerSrc(
	playbackId: string,
	opts: { autoplay?: boolean | null; muted?: boolean } = {},
): string {
	const url = new URL(`https://player.mux.com/${playbackId}`);
	if (opts.autoplay) {
		url.searchParams.set("autoplay", "true");
		url.searchParams.set("muted", String(opts.muted !== false));
	}
	return url.toString();
}
