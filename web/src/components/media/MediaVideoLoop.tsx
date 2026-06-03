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
 * - Poster WebP `srcset`/`sizes` track the container width (retina-aware).
 * - Prefers AV1 → HEVC → H.264 HLS renditions when the manifest and browser support them.
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
import { VolumeMutedIcon } from "@/src/components/icons/VolumeMutedIcon";
import { VolumeOnIcon } from "@/src/components/icons/VolumeOnIcon";

import {
	extractMuxPlaybackId,
	getMuxDisplayDimensions,
	LOOP_POSTER_MAX_WIDTH_PX,
	muxLoopHlsSrc,
	muxThumbnailRequestWidthPx,
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
	/**
	 * When true, render a small overlay button (bottom-right) that lets the visitor toggle
	 * audio on/off. The loop starts muted regardless — browser autoplay policies forbid
	 * unmuted autoplay without a user gesture, and the button click is that gesture.
	 *
	 * Driven from Sanity via the `media.videoLoop.allowUnmute` field; default is `false`
	 * so silent background loops (hero, decorative motion) remain truly silent.
	 */
	allowUnmute?: boolean;
	/** Fires on `<video>.timeupdate` (~4×/s by browser). For external progress UI. */
	onTimeUpdate?: (currentTime: number, duration: number) => void;
	/** Fires on `<video>.ended`. Only meaningful when `loop={false}`. */
	onEnded?: () => void;
	/**
	 * Reports network/buffer load progress 0 → 1 monotonically. Reaches 1 at the
	 * `canplay` event (= when playback actually starts). Drives the wordmark
	 * loading-bridge in `ModuleIntro` — the logo stroke + fill animate exactly
	 * in step with how much of the first segment has buffered.
	 */
	onLoadProgress?: (progress: number) => void;
	/**
	 * Stacked carousel slide: eager poster + preload, play/poster handlers only
	 * when {@link isActive} (prevents inactive slides from hiding their poster).
	 */
	stackedSlide?: boolean;
	/** Next carousel slide — attach HLS paused for smooth crossfade on advance. */
	isNextSlide?: boolean;
	/**
	 * Delay the HLS attach (manifest fetch + hls.js init) by this many ms after
	 * mount. Used to stagger multiple stacked loops on initial page-load so they
	 * don't all instantiate hls.js + fetch their manifests in the same 100 ms
	 * burst. Only takes effect when `skipVisibilityGate` is set (otherwise the
	 * `IntersectionObserver` already gates attach). Default 0 = attach
	 * immediately when the visibility gate clears.
	 */
	hlsAttachDelayMs?: number;
	/**
	 * Apply the SVG sharpen + contrast filter on the `<video>` element. Default
	 * `true`. `ModuleIntro` flips this to `false` while the loading-bridge logo
	 * is still covering the video, so the shader-compile cost doesn't compete
	 * with all the other first-paint work.
	 */
	enableFilter?: boolean;
};

/** Widths used for the poster `srcset` when coming from Sanity. */
const POSTER_SRCSET_WIDTHS = [480, 768, 1080, 1440, 1920, 2560, 3840] as const;

type PosterSource = { src: string; srcSet?: string };

function resolvePosterFromSanity(
	posterPayload: unknown,
	thumbWidthPx: number,
): PosterSource | null {
	const img = resolveSanityImageFieldForUrl(posterPayload);
	if (!img) return null;
	const cap = Math.min(thumbWidthPx, 3840);
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
	thumbWidthPx: number,
): PosterSource {
	/* Always extract the t=0 frame so the poster matches the first decoded
	 * video frame and the fade-out (`onLoadedData` → `opacity-0`) is invisible.
	 * Mux's editor-selected `thumbTime` is deliberately ignored — for a loop the
	 * meaningful frame is the one playback starts on, not an arbitrary still. */
	const cap = Math.min(thumbWidthPx, LOOP_POSTER_MAX_WIDTH_PX, 3840);
	const thumbOpts = { format: "webp" as const };
	const src = muxThumbnailUrl(playbackId, 0, { ...thumbOpts, width: cap });
	const srcSet = POSTER_SRCSET_WIDTHS.filter((w) => w <= cap)
		.map(
			(w) =>
				`${muxThumbnailUrl(playbackId, 0, { ...thumbOpts, width: w })} ${w}w`,
		)
		.join(", ");
	return { src, srcSet: srcSet || undefined };
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
	allowUnmute = false,
	onTimeUpdate,
	onEnded,
	onLoadProgress,
	stackedSlide = false,
	isNextSlide = false,
	hlsAttachDelayMs = 0,
	enableFilter = true,
}: MediaVideoLoopProps) {
	const playbackId = extractMuxPlaybackId(media);
	const [containerRef, slotWidthPx] = useContainerPixelWidth<HTMLDivElement>();
	const videoRef = useRef<HTMLVideoElement>(null);
	const isActiveRef = useRef(isActive);
	isActiveRef.current = isActive;
	const loadedEmitted = useRef(false);
	const [posterHidden, setPosterHidden] = useState(false);
	const [shouldAttachHls, setShouldAttachHls] = useState(
		skipVisibilityGate && hlsAttachDelayMs === 0,
	);
	/* Staggered HLS init: when several stacked loops mount simultaneously
	 * (e.g. the intro carousel) we delay later slides' hls.js instantiation
	 * + manifest fetch so they don't all hammer the main thread in the same
	 * 100 ms window. Only relevant on the visibility-gate-bypass path; the
	 * `IntersectionObserver` branch already paces attach by viewport entry. */
	useEffect(() => {
		if (shouldAttachHls) return;
		if (!skipVisibilityGate) return;
		if (hlsAttachDelayMs <= 0) {
			setShouldAttachHls(true);
			return;
		}
		const t = window.setTimeout(
			() => setShouldAttachHls(true),
			hlsAttachDelayMs,
		);
		return () => window.clearTimeout(t);
	}, [hlsAttachDelayMs, skipVisibilityGate, shouldAttachHls]);
	const [reducedMotion, setReducedMotion] = useState(false);
	/**
	 * Audio toggle state. Always starts `true` (muted) — browser autoplay policy. Flipped
	 * by the overlay control rendered when `allowUnmute === true`. The click counts as the
	 * required user gesture, so the post-toggle `tryPlay()` is allowed to produce sound.
	 */
	const [muted, setMuted] = useState(true);

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => setReducedMotion(mq.matches);
		sync();
		mq.addEventListener?.("change", sync);
		return () => mq.removeEventListener?.("change", sync);
	}, []);

	/* Monotonic load-progress 0 → 1 for the loading bridge. Fed by native
	 * `<video>` events so it works for both hls.js (MSE) and native HLS:
	 *   - `loadstart` kicks the value off 0 so the UI begins reacting immediately
	 *   - `loadedmetadata` lifts to ~0.15 once dimensions/duration are known
	 *   - `progress` events advance based on `buffered.end(0)` versus a 2.5 s
	 *     target (typical buffer needed before `canplay`)
	 *   - `canplay` snaps to 1.0 — the loading bridge's dismiss signal */
	const onLoadProgressRef = useRef(onLoadProgress);
	onLoadProgressRef.current = onLoadProgress;
	useEffect(() => {
		if (!onLoadProgressRef.current) return;
		const el = videoRef.current;
		if (!el) return;
		let current = 0;
		const emit = (p: number) => {
			const next = Math.max(current, Math.min(1, p));
			if (next === current) return;
			current = next;
			onLoadProgressRef.current?.(next);
		};
		const onLoadStart = () => emit(0.05);
		const onLoadedMetadata = () => emit(0.15);
		const onProgress = () => {
			const b = el.buffered;
			if (b.length === 0) return;
			const bufferedSec = b.end(0);
			/* 2.5 s of buffered media is roughly what hls.js needs before canplay
			 * fires for a Mux loop. Map to 0.15 → 0.95 so the very last beat is
			 * reserved for the canplay snap. */
			const ratio = Math.min(bufferedSec / 2.5, 1);
			emit(0.15 + 0.8 * ratio);
		};
		const onCanPlay = () => emit(1);
		el.addEventListener("loadstart", onLoadStart);
		el.addEventListener("loadedmetadata", onLoadedMetadata);
		el.addEventListener("progress", onProgress);
		el.addEventListener("canplay", onCanPlay);
		/* If the video is already past these events at mount (warm HTTP cache),
		 * surface the correct progress immediately so the bridge can dismiss. */
		if (el.readyState >= 3) emit(1);
		else if (el.readyState >= 1) onLoadedMetadata();
		return () => {
			el.removeEventListener("loadstart", onLoadStart);
			el.removeEventListener("loadedmetadata", onLoadedMetadata);
			el.removeEventListener("progress", onProgress);
			el.removeEventListener("canplay", onCanPlay);
		};
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
		/* Prefer the Mux thumbnail at t=0 — it matches the first decoded frame.
		 * An editorially-uploaded Sanity poster is kept only as a defensive
		 * fallback for the (currently impossible) case where the Mux thumbnail
		 * URL can't be built. */
		return (
			resolvePosterFromMux(playbackId, thumbWidthPx) ??
			resolvePosterFromSanity(posterPayload, thumbWidthPx)
		);
	}, [playbackId, posterPayload, thumbWidthPx]);

	const hlsSrc = useMemo(() => {
		if (!playbackId) return "";
		const vw = dims && !dims.isFallback ? dims.width : 16;
		const vh = dims && !dims.isFallback ? dims.height : 9;
		/* Deterministic per asset: no viewport / DPR inputs. `muxLoopHlsSrc`
		 * without container dims falls back to the hard 1440p ceiling
		 * (`LOOP_VIDEO_MAX_TIER`), which is the only thing the manifest URL
		 * needs to express. Fine-grained level picking happens via
		 * `useObjectCoverPick` against `video.clientWidth/Height` in
		 * `useMuxHlsSource`. Decoupling from `window.innerSize` means a viewport
		 * resize never invalidates this memo → no manifest reload. */
		return muxLoopHlsSrc(playbackId, {
			videoWidthPx: vw,
			videoHeightPx: vh,
		});
	}, [playbackId, dims]);

	const objectCoverVideoPx =
		dims && !dims.isFallback
			? { width: dims.width, height: dims.height }
			: undefined;
	const stackedFill = stackedSlide && fillParent;
	/* Once visible we attach HLS for every slide and keep it for the carousel's
	 * whole lifetime. Inactive stacked slides have `loadingPaused = true` so
	 * `hls.stopLoad()` runs after the first manifest parse — MSE buffer stays
	 * intact, so A → B → A re-activation plays from cache (no segment re-fetch).
	 * Previously we gated attach on `isActive || isNextSlide` and tore HLS down
	 * for the rest, which forced a fresh manifest + full re-buffer on return. */
	const attachHls = shouldAttachHls && Boolean(playbackId);
	/* Pre-buffer the next slide so its `play()` after activation doesn't have
	 * to wait for the first segment fetch — that wait is what causes the
	 * mid-crossfade "video freezes for ~300 ms before snapping into motion"
	 * stutter when the carousel advances. Inactive non-next slides still
	 * `stopLoad()` immediately after manifest-parsed → no parallel segment
	 * storms. After a slide has played once, its MSE buffer survives the
	 * subsequent pause cycle so A → B → A still costs zero extra bytes. */
	const hlsLoadingPaused = stackedSlide && !isActive && !isNextSlide;
	useMuxHlsSource(videoRef, attachHls ? playbackId : null, hlsSrc, {
		audioEnabled: !muted,
		preferModernCodecs: true,
		useObjectCoverPick: true,
		objectCoverVideoPx,
		tuneForShortLoop: true,
		loadingPaused: hlsLoadingPaused,
	});

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

	/**
	 * Keep the DOM `<video>.muted` property aligned with React state. The JSX `muted`
	 * attribute alone is only read on mount; React doesn't re-apply it on re-render, so we
	 * write directly to the element when the state flips.
	 */
	useEffect(() => {
		const el = videoRef.current;
		if (!el) return;
		el.muted = muted;
	}, [muted]);

	const onToggleMute = useCallback(() => {
		setMuted((prev) => {
			const next = !prev;
			/* Unmuting counts as a user gesture — safe to start playback even under reduced
			 * motion or while the element was paused (e.g. just scrolled into view). */
			if (!next) {
				queueMicrotask(() => tryPlay());
			}
			return next;
		});
	}, [tryPlay]);

	const hidePosterWhenReady = useCallback(() => {
		if (stackedSlide && !isActiveRef.current) return;
		setPosterHidden(true);
		emitLoadedOnce();
	}, [emitLoadedOnce, stackedSlide]);

	const tryPlayIfActive = useCallback(() => {
		if (stackedSlide && !isActiveRef.current) return;
		if (reducedMotion) return;
		tryPlay();
	}, [tryPlay, reducedMotion, stackedSlide]);

	useLayoutEffect(() => {
		if (!skipVisibilityGate || !isActive || !playbackId || reducedMotion) {
			return;
		}
		tryPlay();
	}, [skipVisibilityGate, isActive, playbackId, tryPlay, reducedMotion]);

	useEffect(() => {
		const el = videoRef.current;
		if (!el) return;
		if (!isActive) {
			el.pause();
			return;
		}
		if (el.ended) {
			el.currentTime = 0;
		}
		/* Inactive slides may have hidden the poster during background HLS decode — restore
		 * until this slide actually plays. */
		if (
			stackedSlide &&
			el.paused &&
			el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
		) {
			setPosterHidden(false);
		}
		if (reducedMotion) return;

		const play = () => {
			void el.play().catch(() => {});
		};
		play();
		if (el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
			el.addEventListener("canplay", play, { once: true });
			return () => el.removeEventListener("canplay", play);
		}
	}, [isActive, reducedMotion, stackedSlide]);

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
				stackedFill
					? "h-full w-full overflow-hidden"
					: "relative w-full overflow-hidden",
				fillParent &&
					!stackedFill &&
					"h-full min-h-[100dvh] w-full [&_video]:min-h-full [&_video]:min-w-full [&_video]:object-cover",
				stackedFill &&
					"[&_video]:min-h-full [&_video]:min-w-full [&_video]:object-cover",
				/* Skip layout + paint + style cost while off-screen. The element
				 * keeps its size (we have explicit dimensions / aspect-ratio) so
				 * scroll position stays stable. Above-the-fold heros are visible
				 * at mount → no effect there; below-the-fold body loops get the
				 * full benefit. */
				"[content-visibility:auto]",
				className,
			)}
			style={fillParent || stackedFill ? undefined : { aspectRatio: aspectCss }}
		>
			<video
				ref={videoRef}
				{...(dims && !dims.isFallback
					? { width: dims.width, height: dims.height }
					: {})}
				className={clsx(
					/* `object-center` is the CSS default but explicit so the
					 * `[&_video]:object-cover` overrides further up the cascade
					 * don't accidentally introduce a top-left anchor. The video
					 * always crops from both opposite edges equally — the middle
					 * of the frame stays put when the viewport resizes. */
					"absolute inset-0 z-0 h-full w-full object-cover object-center",
					/* Perceptual sharpening: unsharp-mask SVG filter + a touch more
					 * contrast/saturation. GPU-side, zero bandwidth on desktop
					 * GPUs. Skipped under prefers-reduced-motion AND under the
					 * `md` breakpoint — phones get the raw video. Their GPUs are
					 * smaller, their pixels are denser (less softness to fight),
					 * and the convolution pass on a 1440p frame at 30 fps is real
					 * battery. The `will-change: filter` hint promotes the video
					 * to its own composite layer so the filter pass stays off
					 * the main paint.
					 *
					 * `enableFilter` defers the shader-compile cost out of the
					 * busy first-paint window. `ModuleIntro` flips this `true`
					 * only after the loading-bridge logo dismisses — by then
					 * HLS init and decode startup are settled, the GPU isn't
					 * competing with anyone for resources. */
					!reducedMotion &&
						enableFilter &&
						"md:[filter:url(#mvl-sharpen)_contrast(1.04)_saturate(1.03)] md:[will-change:filter]",
				)}
				muted
				playsInline
				autoPlay={!reducedMotion && (!stackedSlide || isActive)}
				loop={loop}
				preload={
					reducedMotion
						? "none"
						: stackedSlide
							? isActive
								? "auto"
								: isNextSlide
									? "metadata"
									: "none"
							: "metadata"
				}
				disablePictureInPicture
				aria-label={caption || undefined}
				onLoadedData={hidePosterWhenReady}
				onCanPlay={tryPlayIfActive}
				onPlaying={hidePosterWhenReady}
				onTimeUpdate={
					onTimeUpdate
						? (e) => {
								const el = e.currentTarget;
								onTimeUpdate(el.currentTime, el.duration);
							}
						: undefined
				}
				onEnded={onEnded}
			/>
			{/* biome-ignore lint/performance/noImgElement: deterministic Sanity / Mux URLs — next/image optimizer would cause SSR/CSR URL drift. */}
			<img
				src={poster.src}
				srcSet={poster.srcSet}
				sizes={poster.srcSet ? posterSizes : undefined}
				alt={caption || ""}
				width={dims && !dims.isFallback ? dims.width : undefined}
				height={dims && !dims.isFallback ? dims.height : undefined}
				loading={posterPriority || stackedSlide ? "eager" : "lazy"}
				fetchPriority={posterPriority ? "high" : "auto"}
				decoding={posterPriority ? "sync" : "async"}
				className={clsx(
					/* 700 ms fade (was 300) so the poster's exit overlaps the
					 * 1200 ms logo-bridge dismiss in `ModuleIntro` — staggered
					 * reveal instead of three transitions racing each other. */
					"pointer-events-none absolute inset-0 z-10 h-full w-full object-cover object-center transition-opacity duration-700",
					posterHidden ? "opacity-0" : "opacity-100",
				)}
				aria-hidden={posterHidden ? "true" : undefined}
			/>
			{allowUnmute ? (
				<button
					type="button"
					onClick={onToggleMute}
					aria-label={muted ? "Sound einschalten" : "Sound ausschalten"}
					aria-pressed={!muted}
					className={clsx(
						"absolute right-sm bottom-sm z-20",
						"inline-flex h-10 w-10 items-center justify-center",
						"rounded-full bg-black/40 text-white",
						"backdrop-blur-sm transition-colors",
						"hover:bg-black/60",
						"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
					)}
				>
					{muted ? <VolumeMutedIcon /> : <VolumeOnIcon />}
				</button>
			) : null}
		</div>
	);
}
