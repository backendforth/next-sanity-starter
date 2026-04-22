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

export type MuxThumbnailOptions = {
	/** CSS-pixel width; Mux downscales from source. Callers should cap to retina × container. */
	width?: number;
};

export function muxThumbnailUrl(
	playbackId: string,
	timeSec = 0,
	opts?: MuxThumbnailOptions,
): string {
	const u = new URL(`https://image.mux.com/${playbackId}/thumbnail.jpg`);
	u.searchParams.set("time", String(timeSec));
	if (opts?.width !== undefined && opts.width > 0) {
		u.searchParams.set("width", String(Math.round(opts.width)));
	}
	return u.toString();
}

/**
 * Pixel width for `image.mux.com` thumbnails: ~2× layout width, capped by the source asset and
 * the Mux practical upper bound (3840). Falls back to 1280 when the container width is unknown.
 */
export function muxThumbnailRequestWidthPx(args: {
	containerWidthPx: number | undefined;
	assetMaxWidthPx: number | undefined;
}): number {
	const assetCap =
		args.assetMaxWidthPx && args.assetMaxWidthPx > 0
			? args.assetMaxWidthPx
			: 3840;
	const base =
		typeof args.containerWidthPx === "number" && args.containerWidthPx > 0
			? args.containerWidthPx
			: 1280;
	const retina = Math.ceil(base * 2);
	return Math.min(3840, assetCap, retina);
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
 * HLS URL for `stream.mux.com` (native `<video>` or hls.js).
 *
 * **`rendition_order=desc`** (default): Mux lists highest renditions first. Many native players
 * pick the first variant for the first segment — without this, playback often starts at a mid/low
 * rung even on fast connections.
 *
 * @see https://docs.mux.com/guides/control-playback-resolution
 */
export function muxHlsSrc(
	playbackId: string,
	opts: { renditionOrderDesc?: boolean } = {},
): string {
	const u = new URL(`https://stream.mux.com/${playbackId}.m3u8`);
	if (opts.renditionOrderDesc !== false) {
		u.searchParams.set("rendition_order", "desc");
	}
	return u.toString();
}

/**
 * `player.mux.com` iframe URL — retained for fallback / debugging. Production `MediaVideo` uses
 * the React component `<MuxPlayer/>` directly.
 */
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

/**
 * Mux `asset.thumbTime` — the time (in seconds) selected in Studio for the poster frame.
 */
export function muxThumbnailTimeSec(media: unknown): number {
	if (!media || typeof media !== "object") return 0;
	const asset = (media as Record<string, unknown>).asset;
	if (!asset || typeof asset !== "object") return 0;
	const t = (asset as Record<string, unknown>).thumbTime;
	return typeof t === "number" ? t : 0;
}
