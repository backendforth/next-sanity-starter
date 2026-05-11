"use client";

/**
 * Mux playback via **`@mux/mux-player-react/lazy`**: poster until play (unless autoplay).
 * Wrapper class `mux-player` scopes look-and-feel (`components/mux-player.css`).
 *
 * Use {@link MediaVideoLoop} for silent, looping background clips (`autoplay` + no controls).
 */

import MuxPlayer from "@mux/mux-player-react/lazy";
import clsx from "clsx";
import type { CSSProperties } from "react";

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
	/** Fill the parent (no fixed aspect ratio) — e.g. fullscreen background video. */
	fillParent?: boolean;
	/** Optional fixed aspect ratio override (e.g. `"3 / 2"`). */
	aspectRatioOverride?: string;
	/**
	 * Optional override for Mux `accentColor` (progress / scrubber). Default `#262626`.
	 */
	accentColor?: string;
};

/** Progress / scrubber accent — dark grey (Mux default is pink). */
const MUX_ACCENT = "#262626";
/** Icons on the control bar. */
const MUX_PRIMARY = "#e3e3e3";
/** Control bar surface — transparent so controls have no chip/backplate. */
const MUX_SECONDARY = "transparent";

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
	fillParent = false,
	aspectRatioOverride,
	accentColor: accentColorProp,
}: MediaVideoProps) {
	const playbackId = extractMuxPlaybackId(media);
	const [containerRef, slotWidthPx] = useContainerPixelWidth<HTMLDivElement>();

	if (!playbackId) return null;

	const dims = getMuxDisplayDimensions(media);
	const aspectCss = dims.isFallback
		? "16 / 9"
		: `${dims.width} / ${dims.height}`;
	const resolvedAspectRatio = aspectRatioOverride ?? aspectCss;

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

	const autoplay = !!videoSettings?.autoplay;
	const chromeless = videoSettings?.controls === false;

	const muxSurfaceStyle = {
		...(fillParent
			? { height: "100%", width: "100%", minHeight: "100%" as const }
			: { height: "100%", width: "100%" }),
		...(chromeless
			? ({
					["--media-control-display" as string]: "none",
				} as CSSProperties)
			: {}),
	} satisfies CSSProperties;

	const videoTitle =
		typeof caption === "string" && caption.length > 0 ? caption : "Video";

	return (
		<div
			ref={containerRef}
			className={clsx(
				"mux-player relative w-full min-w-0 overflow-hidden bg-black",
				fillParent &&
					"h-full min-h-[100dvh] w-full [&_mux-player]:!block [&_mux-player]:!h-full [&_mux-player]:!min-h-full [&_mux-player]:!w-full",
				className,
			)}
			style={fillParent ? undefined : { aspectRatio: resolvedAspectRatio }}
		>
			<MuxPlayer
				loading="viewport"
				streamType="on-demand"
				playbackId={playbackId}
				poster={posterUrl}
				thumbnailTime={muxThumbnailTimeSec(media)}
				autoPlay={autoplay}
				muted={autoplay}
				playsInline
				renditionOrder="desc"
				metadataVideoTitle={videoTitle}
				accentColor={accentColorProp ?? MUX_ACCENT}
				primaryColor={MUX_PRIMARY}
				secondaryColor={MUX_SECONDARY}
				className="absolute inset-0 block h-full w-full max-w-none"
				style={muxSurfaceStyle}
			/>
		</div>
	);
}
