"use client";

/**
 * Native `<video>` Mux HLS loop. Used for silent background / hero loops where `<MuxPlayer/>`
 * (controls, chrome) would be overkill. Parallel to {@link MediaVideo} (which renders MuxPlayer).
 *
 * Improvements over a plain autoplay `<video>`:
 * - HLS source attached lazily via `IntersectionObserver` + dynamic `hls.js` import — no bytes
 *   downloaded for off-screen loops.
 * - Poster fades out once the first frame is decoded (no hard cut).
 * - Respects `prefers-reduced-motion`: skips autoplay and leaves the poster in place.
 * - Poster `srcset`/`sizes` track the container width (retina-aware).
 */

import clsx from "clsx";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import {
	resolveSanityImageFieldForUrl,
	urlForFetchedImage,
} from "@/sanity/utils/sanityImageBuilder";

import {
	extractMuxPlaybackId,
	getMuxDisplayDimensions,
	muxHlsSrc,
	muxThumbnailRequestWidthPx,
	muxThumbnailTimeSec,
	muxThumbnailUrl,
} from "@/src/utils/muxPlayback";
import { useContainerPixelWidth } from "@/src/utils/useContainerPixelWidth";
import { useMuxHlsSource } from "@/src/utils/useMuxHlsSource";

export type MediaVideoLoopProps = {
	media: unknown;
	caption?: string | null;
	posterPayload?: unknown;
	/** Full-bleed in parent (no fixed aspect ratio) — e.g. hero background. */
	fillParent?: boolean;
	className?: string;
	/**
	 * External pause/play control. When false the loop pauses even if on-screen.
	 * Typical use: carousel slides that are not active.
	 */
	isActive?: boolean;
	/** Called once after the first video frame is decoded. */
	onLoaded?: () => void;
	loop?: boolean;
	/** For above-the-fold loops — sets `priority` / `fetchpriority=high` on the poster. */
	posterPriority?: boolean;
	/**
	 * Skip the `IntersectionObserver` gate (e.g. hero video should load immediately even if the
	 * initial render is briefly off-screen during hydration).
	 */
	skipVisibilityGate?: boolean;
};

/** Widths used for the poster `srcset` when coming from Sanity. */
const POSTER_SRCSET_WIDTHS = [480, 768, 1080, 1440, 1920] as const;

type PosterSource = { src: string; srcSet?: string };

function resolvePosterFromSanity(
	posterPayload: unknown,
	thumbWidthPx: number,
): PosterSource | null {
	const img = resolveSanityImageFieldForUrl(posterPayload);
	if (!img) return null;
	const cap = Math.min(thumbWidthPx, 1920);
	const src = urlForFetchedImage(img, cap);
	if (!src) return null;
	const srcSet = POSTER_SRCSET_WIDTHS.filter((w) => w <= cap)
		.map((w) => {
			const url = urlForFetchedImage(img, w);
			return url ? `${url} ${w}w` : null;
		})
		.filter(Boolean)
		.join(", ");
	return { src, srcSet: srcSet || undefined };
}

function resolvePosterFromMux(
	playbackId: string,
	media: unknown,
	thumbWidthPx: number,
): PosterSource {
	const time = muxThumbnailTimeSec(media);
	return {
		src: muxThumbnailUrl(playbackId, time, { width: thumbWidthPx }),
	};
}

export function MediaVideoLoop({
	media,
	caption,
	posterPayload,
	fillParent = false,
	className,
	isActive = true,
	onLoaded,
	loop = true,
	posterPriority = false,
	skipVisibilityGate = false,
}: MediaVideoLoopProps) {
	const playbackId = extractMuxPlaybackId(media);
	const [containerRef, slotWidthPx] = useContainerPixelWidth<HTMLDivElement>();
	const videoRef = useRef<HTMLVideoElement>(null);
	const loadedEmitted = useRef(false);
	const [posterHidden, setPosterHidden] = useState(false);
	const [shouldAttachHls, setShouldAttachHls] = useState(skipVisibilityGate);
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => setReducedMotion(mq.matches);
		sync();
		mq.addEventListener?.("change", sync);
		return () => mq.removeEventListener?.("change", sync);
	}, []);

	const dims = playbackId ? getMuxDisplayDimensions(media) : null;
	const aspectCss = dims?.isFallback
		? "16 / 9"
		: `${dims?.width ?? 16} / ${dims?.height ?? 9}`;

	const thumbWidthPx = muxThumbnailRequestWidthPx({
		containerWidthPx: slotWidthPx,
		assetMaxWidthPx: dims && !dims.isFallback ? dims.width : undefined,
	});

	const poster = useMemo(() => {
		if (!playbackId) return null;
		return (
			resolvePosterFromSanity(posterPayload, thumbWidthPx) ??
			resolvePosterFromMux(playbackId, media, thumbWidthPx)
		);
	}, [playbackId, posterPayload, media, thumbWidthPx]);

	const hlsSrc = useMemo(
		() => (playbackId ? muxHlsSrc(playbackId) : ""),
		[playbackId],
	);
	useMuxHlsSource(videoRef, shouldAttachHls ? playbackId : null, hlsSrc);

	const emitLoadedOnce = useCallback(() => {
		if (loadedEmitted.current) return;
		loadedEmitted.current = true;
		onLoaded?.();
	}, [onLoaded]);

	const tryPlay = useCallback(() => {
		const el = videoRef.current;
		if (!el) return;
		const p = el.play();
		if (p !== undefined) {
			p.catch(() => {
				/* autoplay policies / paused for off-screen */
			});
		}
	}, []);

	const hidePosterWhenReady = useCallback(() => {
		setPosterHidden(true);
		emitLoadedOnce();
	}, [emitLoadedOnce]);

	useLayoutEffect(() => {
		if (!skipVisibilityGate || !isActive || !playbackId || reducedMotion) {
			return;
		}
		tryPlay();
	}, [skipVisibilityGate, isActive, playbackId, tryPlay, reducedMotion]);

	useEffect(() => {
		if (!isActive) {
			videoRef.current?.pause();
			return;
		}
		if (!skipVisibilityGate && !reducedMotion) {
			tryPlay();
		}
	}, [isActive, skipVisibilityGate, tryPlay, reducedMotion]);

	useEffect(() => {
		if (skipVisibilityGate) return;
		const root = containerRef.current;
		if (!root || !playbackId) return;

		const io = new IntersectionObserver(
			([entry]) => {
				if (!entry) return;
				if (entry.isIntersecting) {
					setShouldAttachHls(true);
					if (isActive && !reducedMotion) tryPlay();
				} else {
					const el = videoRef.current;
					window.setTimeout(() => el?.pause(), 100);
				}
			},
			{ rootMargin: "400px", threshold: 0 },
		);
		io.observe(root);
		return () => io.disconnect();
	}, [
		playbackId,
		isActive,
		tryPlay,
		containerRef,
		skipVisibilityGate,
		reducedMotion,
	]);

	if (!playbackId || !poster) {
		return null;
	}

	const posterSizes = fillParent
		? "100vw"
		: typeof slotWidthPx === "number" && slotWidthPx > 0
			? `${slotWidthPx}px`
			: "(max-width: 900px) 100vw, min(100vw, var(--container-width, 1200px))";

	return (
		<div
			ref={containerRef}
			className={clsx(
				"relative w-full overflow-hidden",
				fillParent &&
					"h-full min-h-[100dvh] w-full [&_video]:min-h-full [&_video]:min-w-full [&_video]:object-cover",
				className,
			)}
			style={fillParent ? undefined : { aspectRatio: aspectCss }}
		>
			<video
				ref={videoRef}
				{...(dims && !dims.isFallback
					? { width: dims.width, height: dims.height }
					: {})}
				className="absolute inset-0 z-0 h-full w-full object-cover"
				muted
				playsInline
				autoPlay={!reducedMotion}
				loop={loop}
				preload={reducedMotion ? "none" : "auto"}
				disablePictureInPicture
				aria-label={caption || undefined}
				onLoadedData={hidePosterWhenReady}
				onCanPlay={tryPlay}
				onPlaying={hidePosterWhenReady}
			/>
			{/* biome-ignore lint/performance/noImgElement: deterministic Sanity / Mux URLs — next/image optimizer would cause SSR/CSR URL drift. */}
			<img
				src={poster.src}
				srcSet={poster.srcSet}
				sizes={poster.srcSet ? posterSizes : undefined}
				alt={caption || ""}
				width={dims && !dims.isFallback ? dims.width : undefined}
				height={dims && !dims.isFallback ? dims.height : undefined}
				loading={posterPriority ? "eager" : "lazy"}
				fetchPriority={posterPriority ? "high" : "auto"}
				decoding={posterPriority ? "sync" : "async"}
				className={clsx(
					"pointer-events-none absolute inset-0 z-10 h-full w-full object-cover transition-opacity duration-300",
					posterHidden ? "opacity-0" : "opacity-100",
				)}
				aria-hidden={posterHidden ? "true" : undefined}
			/>
		</div>
	);
}
