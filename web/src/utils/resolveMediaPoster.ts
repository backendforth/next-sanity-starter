import {
	getCroppedImageDisplayDimensions,
	resolveSanityImageFieldForUrl,
	urlForFetchedImage,
} from "@/sanity/utils/sanityImageBuilder";

import {
	extractMuxPlaybackId,
	getMuxDisplayDimensions,
	muxThumbnailTimeSec,
	muxThumbnailUrl,
} from "@/src/utils/muxPlayback";

/** `srcset` ladder for posters (Sanity CDN and `image.mux.com`). */
const POSTER_SRCSET_WIDTHS = [480, 768, 1080, 1440, 1920, 2560, 3840] as const;

/** Hard cap for poster request widths — matches `muxThumbnailRequestWidthPx`. */
const POSTER_MAX_WIDTH_PX = 3840;

export type ResolveMediaPosterOptions = {
	/** Editorial poster (`poster` image field on `media.video` / `media.videoLoop`). */
	posterPayload?: unknown;
	/** Mux video payload (`videoQuery`) — its thumbnail is the fallback poster. */
	muxMedia?: unknown;
	/** Requested width in px, usually `muxThumbnailRequestWidthPx(...)`. */
	thumbWidthPx: number;
	/**
	 * Mux thumbnail time in seconds. Defaults to the asset's `thumbTime` (the poster frame
	 * picked in Studio), then `0`. Loops pass `0` so the fallback still matches their first frame.
	 */
	muxTimeSec?: number;
	/** Tighter cap for the Mux poster width (loops pass `LOOP_POSTER_MAX_WIDTH_PX`). */
	muxMaxWidthPx?: number;
};

export type ResolvedMediaPosterUrls = {
	src: string;
	srcSet?: string;
	/** Intrinsic size of the poster (cropped Sanity image or Mux video track). */
	width: number;
	height: number;
};

function srcSetFor(cap: number, urlAt: (w: number) => string | null): string {
	return POSTER_SRCSET_WIDTHS.filter((w) => w <= cap)
		.map((w) => {
			const url = urlAt(w);
			return url ? `${url} ${w}w` : null;
		})
		.filter(Boolean)
		.join(", ");
}

function resolveSanityPoster(
	posterPayload: unknown,
	thumbWidthPx: number,
): ResolvedMediaPosterUrls | null {
	const image = resolveSanityImageFieldForUrl(posterPayload);
	if (!image) return null;
	const cap = Math.min(thumbWidthPx, POSTER_MAX_WIDTH_PX);
	const src = urlForFetchedImage(image, cap);
	if (!src) return null;
	const { width, height } = getCroppedImageDisplayDimensions(image);
	const srcSet = srcSetFor(cap, (w) => urlForFetchedImage(image, w));
	return { src, srcSet: srcSet || undefined, width, height };
}

function resolveMuxPoster(
	muxMedia: unknown,
	thumbWidthPx: number,
	timeSec: number,
	maxWidthPx: number,
): ResolvedMediaPosterUrls | null {
	const playbackId = extractMuxPlaybackId(muxMedia);
	if (!playbackId) return null;
	const { width, height } = getMuxDisplayDimensions(muxMedia);
	const cap = Math.min(thumbWidthPx, maxWidthPx, POSTER_MAX_WIDTH_PX);
	const src = muxThumbnailUrl(playbackId, timeSec, { width: cap });
	const srcSet = srcSetFor(cap, (w) =>
		muxThumbnailUrl(playbackId, timeSec, { width: w }),
	);
	return { src, srcSet: srcSet || undefined, width, height };
}

/**
 * Poster for players, loops and image fallbacks: the uploaded Sanity poster when set, otherwise
 * the Mux thumbnail (WebP). The uploaded poster always wins, so a video shows the same still
 * wherever it appears — at the cost of a possible one-frame step when a loop fades from its
 * poster to the first video frame.
 */
export function resolveMediaPosterUrls(
	opts: ResolveMediaPosterOptions,
): ResolvedMediaPosterUrls | null {
	const sanity = resolveSanityPoster(opts.posterPayload, opts.thumbWidthPx);
	if (sanity) return sanity;
	if (!opts.muxMedia) return null;
	return resolveMuxPoster(
		opts.muxMedia,
		opts.thumbWidthPx,
		opts.muxTimeSec ?? muxThumbnailTimeSec(opts.muxMedia),
		opts.muxMaxWidthPx ?? POSTER_MAX_WIDTH_PX,
	);
}

/** Single poster URL — for Mux Player's `poster` prop and similar. */
export function resolveMediaPosterUrl(
	opts: ResolveMediaPosterOptions,
): string | null {
	return resolveMediaPosterUrls(opts)?.src ?? null;
}
