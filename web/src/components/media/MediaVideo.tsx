"use client";

import clsx from "clsx";
import Image from "next/image";
import { useEffect, useState } from "react";

import {
	resolveSanityImageFieldForUrl,
	urlForFetchedImage,
} from "@/sanity/utils/sanityImageBuilder";

import {
	extractMuxPlaybackId,
	getMuxDisplayDimensions,
	muxPlayerSrc,
	muxThumbnailUrl,
} from "@/src/utils/muxPlayback";
import { useContainerPixelWidth } from "@/src/utils/useContainerPixelWidth";

/** Sync: `--breakpoint-sm` in `src/assets/styles/variables/breakpoints.css` (900px). */
const BREAKPOINT_SM_PX = 900;
/** Poster / thumbnail request cap (next/image + Sanity), not a layout token. */
const POSTER_IMAGE_MAX_PX = 1920;

export type MediaVideoProps = {
	media: unknown;
	caption?: string | null;
	posterPayload?: unknown;
	videoSettings?: {
		autoplay?: boolean | null;
		controls?: boolean | null;
	} | null;
	sizesFallback?: string;
	className?: string;
};

const DEFAULT_SIZES_FALLBACK = `(max-width: ${BREAKPOINT_SM_PX}px) 100vw, min(100vw, var(--container-width, 1200px))`;

function muxThumbTimeSec(media: unknown): number {
	if (!media || typeof media !== "object") return 0;
	const asset = (media as Record<string, unknown>).asset;
	if (!asset || typeof asset !== "object") return 0;
	const t = (asset as Record<string, unknown>).thumbTime;
	return typeof t === "number" ? t : 0;
}

function resolvePosterUrl(
	playbackId: string,
	posterPayload: unknown | undefined,
	media: unknown,
	maxWidth: number,
): string {
	const time = muxThumbTimeSec(media);
	if (posterPayload) {
		const img = resolveSanityImageFieldForUrl(posterPayload);
		if (img) {
			const u = urlForFetchedImage(
				img,
				Math.min(POSTER_IMAGE_MAX_PX, maxWidth),
			);
			if (u) return u;
		}
	}
	return muxThumbnailUrl(playbackId, time);
}

/**
 * Mux embed: aspect ratio from `tracks` metadata when present, poster (Sanity or Mux thumbnail),
 * deferred iframe until near-viewport, and `sizes` tied to the container width for the poster image.
 */
export function MediaVideo({
	media,
	caption,
	posterPayload,
	videoSettings,
	sizesFallback = DEFAULT_SIZES_FALLBACK,
	className,
}: MediaVideoProps) {
	const playbackId = extractMuxPlaybackId(media);
	const [containerRef, slotWidthPx] = useContainerPixelWidth<HTMLDivElement>();
	const [loadIframe, setLoadIframe] = useState(false);
	const [iframeReady, setIframeReady] = useState(false);

	useEffect(() => {
		const el = containerRef.current;
		if (!el || !playbackId) return;

		const io = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) setLoadIframe(true);
			},
			{ rootMargin: "280px", threshold: 0.01 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, [playbackId, containerRef]);

	if (!playbackId) return null;

	const dims = getMuxDisplayDimensions(media);
	const aspectCss = dims.isFallback
		? "16 / 9"
		: `${dims.width} / ${dims.height}`;

	const posterMaxW = dims.isFallback
		? POSTER_IMAGE_MAX_PX
		: Math.min(POSTER_IMAGE_MAX_PX, dims.width);
	const posterUrl = resolvePosterUrl(
		playbackId,
		posterPayload,
		media,
		posterMaxW,
	);

	const sizes =
		typeof slotWidthPx === "number" && slotWidthPx > 0
			? `${slotWidthPx}px`
			: sizesFallback;

	const iframeSrc = muxPlayerSrc(playbackId, {
		autoplay: !!videoSettings?.autoplay,
		muted: true,
	});

	const showPoster = !(loadIframe && iframeReady);

	return (
		<div
			ref={containerRef}
			className={clsx("relative w-full overflow-hidden", className)}
			style={{ aspectRatio: aspectCss }}
		>
			{showPoster ? (
				<Image
					src={posterUrl}
					alt={caption || "Video"}
					fill
					sizes={sizes}
					loading="lazy"
					quality={85}
					className="object-cover"
				/>
			) : null}
			{loadIframe ? (
				<iframe
					title={caption || "Video"}
					src={iframeSrc}
					allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
					allowFullScreen
					onLoad={() => setIframeReady(true)}
					className="absolute inset-0 z-10 h-full w-full border-0"
				/>
			) : null}
		</div>
	);
}
