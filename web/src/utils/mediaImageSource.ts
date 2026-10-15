import {
	buildFetchedImageUrl,
	getCroppedImageDisplayDimensions,
	resolveSanityImageFieldForUrl,
} from "@/sanity/utils/sanityImageBuilder";

import {
	extractMuxPlaybackId,
	getMuxDisplayDimensions,
	muxThumbnailTimeSec,
	muxThumbnailUrl,
} from "@/src/utils/muxImage";

/** `srcset` steps below the cap (Sanity CDN and `image.mux.com`); the cap is the last one. */
const SRCSET_WIDTHS = [480, 768, 1080, 1440, 1920] as const;

/**
 * Widest request: 2× a 1280 px slot, lower when the asset is narrower. Not sized to the slot:
 * measuring after mount changes the URL and downloads it twice, so `srcset` + `sizes` pick.
 */
const MAX_WIDTH_PX = 2560;

type MediaImageSourceOptions = {
	/** Sanity image (`imageQuery`): an image, or a video's uploaded poster. Wins when set. */
	image?: unknown;
	/** Mux video (`videoQuery`): its thumbnail stands in when there is no image. */
	muxMedia?: unknown;
	/**
	 * Mux thumbnail time in seconds. Defaults to the asset's `thumbTime` (the poster frame
	 * picked in Studio), then Mux's default frame. Loops pass `0`, the frame playback starts on.
	 */
	muxTimeSec?: number;
	/** A lower cap than {@link MAX_WIDTH_PX} (slide thumbnails, loop posters). */
	maxWidthPx?: number;
	/** Sanity CDN quality (default 85). */
	quality?: number;
};

export type MediaImageSource = {
	src: string;
	srcSet: string;
	/** Intrinsic size (cropped Sanity image or Mux video track). */
	width: number;
	height: number;
};

/** Ladder steps below the cap, plus the cap itself: with `w` descriptors `src` is ignored. */
function srcSetFor(cap: number, urlAt: (w: number) => string | null): string {
	return [...SRCSET_WIDTHS.filter((w) => w < cap), cap]
		.map((w) => {
			const url = urlAt(w);
			return url ? `${url} ${w}w` : null;
		})
		.filter(Boolean)
		.join(", ");
}

function sanityImageSource(
	payload: unknown,
	maxWidthPx: number,
	quality: number,
): MediaImageSource | null {
	const image = resolveSanityImageFieldForUrl(payload);
	if (!image) return null;
	const { width, height } = getCroppedImageDisplayDimensions(image);
	const urlAt = (w: number) =>
		buildFetchedImageUrl(image, { width: w, auto: "format", quality });
	const cap = Math.min(width, maxWidthPx);
	const src = urlAt(cap);
	return src ? { src, srcSet: srcSetFor(cap, urlAt), width, height } : null;
}

function muxThumbnailSource(
	muxMedia: unknown,
	maxWidthPx: number,
	timeSec: number | undefined,
): MediaImageSource | null {
	const playbackId = extractMuxPlaybackId(muxMedia);
	if (!playbackId) return null;
	const { width, height, isFallback } = getMuxDisplayDimensions(muxMedia);
	const urlAt = (w: number) => muxThumbnailUrl(playbackId, timeSec, w);
	const cap = isFallback ? maxWidthPx : Math.min(width, maxWidthPx);
	return { src: urlAt(cap), srcSet: srcSetFor(cap, urlAt), width, height };
}

/**
 * The one URL pipeline for stills: images, video posters, loop posters and slide thumbnails.
 * The uploaded Sanity image wins, otherwise the Mux thumbnail (WebP), so a video shows the same
 * still wherever it appears. Same inputs, same URLs: a carousel's inactive video poster and the
 * activated player's poster share their `src`.
 */
export function resolveMediaImageSource(
	opts: MediaImageSourceOptions,
): MediaImageSource | null {
	const maxWidthPx = Math.min(opts.maxWidthPx ?? MAX_WIDTH_PX, MAX_WIDTH_PX);
	return (
		sanityImageSource(opts.image, maxWidthPx, opts.quality ?? 85) ??
		muxThumbnailSource(
			opts.muxMedia,
			maxWidthPx,
			opts.muxTimeSec ?? muxThumbnailTimeSec(opts.muxMedia),
		)
	);
}
