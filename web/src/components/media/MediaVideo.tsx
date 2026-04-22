"use client";

/**
 * User-facing Mux video with full controls — backed by the official `<MuxPlayer/>` React
 * component (web component + Media Chrome). Imported from `@mux/mux-player-react/lazy` so the
 * player JS is only fetched when the element scrolls near the viewport.
 *
 * Use {@link MediaVideoLoop} for silent, looping background clips where controls are unwanted.
 */

import MuxPlayer from "@mux/mux-player-react/lazy";
import clsx from "clsx";

import {
	resolveSanityImageFieldForUrl,
	urlForFetchedImage,
} from "@/sanity/utils/sanityImageBuilder";

import {
	extractMuxPlaybackId,
	getMuxDisplayDimensions,
	muxThumbnailRequestWidthPx,
	muxThumbnailTimeSec,
	muxThumbnailUrl,
} from "@/src/utils/muxPlayback";
import { useContainerPixelWidth } from "@/src/utils/useContainerPixelWidth";

export type MediaVideoProps = {
	media: unknown;
	caption?: string | null;
	posterPayload?: unknown;
	videoSettings?: {
		autoplay?: boolean | null;
		controls?: boolean | null;
	} | null;
	className?: string;
	/**
	 * Optional accent color for Mux Player chrome (progress bar / buttons). Matches the
	 * `--accent-color` CSS variable on `<mux-player>`.
	 */
	accentColor?: string;
};

function resolvePosterUrl(
	playbackId: string,
	posterPayload: unknown,
	media: unknown,
	thumbWidthPx: number,
): string {
	const img = resolveSanityImageFieldForUrl(posterPayload);
	if (img) {
		const u = urlForFetchedImage(img, Math.min(thumbWidthPx, 1920));
		if (u) return u;
	}
	return muxThumbnailUrl(playbackId, muxThumbnailTimeSec(media), {
		width: thumbWidthPx,
	});
}

export function MediaVideo({
	media,
	caption,
	posterPayload,
	videoSettings,
	className,
	accentColor,
}: MediaVideoProps) {
	const playbackId = extractMuxPlaybackId(media);
	const [containerRef, slotWidthPx] = useContainerPixelWidth<HTMLDivElement>();

	if (!playbackId) return null;

	const dims = getMuxDisplayDimensions(media);
	const aspectCss = dims.isFallback
		? "16 / 9"
		: `${dims.width} / ${dims.height}`;

	const thumbWidthPx = muxThumbnailRequestWidthPx({
		containerWidthPx: slotWidthPx,
		assetMaxWidthPx: dims.isFallback ? undefined : dims.width,
	});
	const posterUrl = resolvePosterUrl(
		playbackId,
		posterPayload,
		media,
		thumbWidthPx,
	);

	const autoPlay = !!videoSettings?.autoplay;

	return (
		<div
			ref={containerRef}
			className={clsx("relative w-full overflow-hidden", className)}
			style={{ aspectRatio: aspectCss }}
		>
			<MuxPlayer
				/* Defer player JS + poster request until the element scrolls near the viewport. */
				loading="viewport"
				playbackId={playbackId}
				streamType="on-demand"
				poster={posterUrl}
				autoPlay={autoPlay ? "muted" : false}
				muted={autoPlay || undefined}
				title={caption || undefined}
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					aspectRatio: aspectCss,
					...(accentColor ? { "--accent-color": accentColor } : {}),
				}}
			/>
		</div>
	);
}
