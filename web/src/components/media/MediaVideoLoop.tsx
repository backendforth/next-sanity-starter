"use client";

/**
 * Native `<video>` Mux HLS loop. Used for silent background / hero loops where `<MuxPlayer/>`
 * (controls, chrome) would be overkill. Parallel to {@link MediaVideo} (which renders MuxPlayer).
 *
 * Improvements over a plain autoplay `<video>`:
 * - HLS source attached lazily via `IntersectionObserver` + dynamic `hls.js` import — no bytes
 *   downloaded for off-screen loops.
 * - Poster fades out once the first frame is actually painted (no hard cut, no black flash).
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
import { VolumeMutedIcon } from "@/src/components/icons/VolumeMutedIcon";
import { VolumeOnIcon } from "@/src/components/icons/VolumeOnIcon";
import { useOptionalLanguage } from "@/src/contexts/LanguageContext";
import { FALLBACK_SITE_LOCALE_CONFIG } from "@/src/i18n/fallbackSiteLocales";
import { uiLabel } from "@/src/i18n/uiLabels";

import {
	extractMuxPlaybackId,
	getMuxDisplayDimensions,
	LOOP_POSTER_MAX_WIDTH_PX,
	muxThumbnailRequestWidthPx,
} from "@/src/utils/muxImage";
import {
	type MuxResolutionTier,
	muxLoopHlsSrc,
	muxTierBelow,
	preconnectMux,
	resolveMuxLoopTier,
} from "@/src/utils/muxPlayback";
import { resolveMediaPosterUrls } from "@/src/utils/resolveMediaPoster";
import { useContainerPixelWidth } from "@/src/utils/useContainerPixelWidth";
import { useMuxHlsSource } from "@/src/utils/useMuxHlsSource";
import { usePrefersReducedMotion } from "@/src/utils/usePrefersReducedMotion";

type MediaVideoLoopProps = {
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
	/** For above-the-fold loops — sets `priority` / `fetchpriority=high` on the poster. */
	posterPriority?: boolean;
	/**
	 * When true, render a small overlay button (bottom-right) that lets the visitor toggle
	 * audio on/off. The loop starts muted regardless — browser autoplay policies forbid
	 * unmuted autoplay without a user gesture, and the button click is that gesture.
	 *
	 * Driven from Sanity via the `media.videoLoop.allowUnmute` field; default is `false`
	 * so silent background loops (hero, decorative motion) remain truly silent.
	 */
	allowUnmute?: boolean;
};

/**
 * Measurement gate fallback: a zero-size or hidden container never reports a size, so after
 * this deadline the loop attaches with the ceiling URL anyway.
 */
const ATTACH_WITHOUT_MEASUREMENT_MS = 300;

/**
 * Stall rescue deadline: a `waiting` stall longer than this means the pinned tier outruns the
 * connection (Safari has no Network Information API to pre-throttle the pick, and Chrome's
 * `downlink` is ignored). The loop then re-attaches one tier lower, per window, down to 720p.
 */
const LOOP_STALL_RESCUE_MS = 4000;

/**
 * Keyed by playback ID, like `MediaVideo`: swapping the asset (in Presentation, or a reused
 * carousel slide) starts a fresh loop instead of inheriting the previous one's stall-rescue
 * ceiling or a rescue timer that is still pending.
 */
export function MediaVideoLoop(props: MediaVideoLoopProps) {
	const playbackId = extractMuxPlaybackId(props.media);
	if (!playbackId) return null;
	preconnectMux();
	return <MuxVideoLoop key={playbackId} {...props} playbackId={playbackId} />;
}

function MuxVideoLoop({
	playbackId,
	media,
	caption,
	posterPayload,
	fillParent = false,
	className,
	isActive = true,
	posterPriority = false,
	allowUnmute = false,
}: MediaVideoLoopProps & { playbackId: string }) {
	const locale =
		useOptionalLanguage()?.currentLocale ??
		FALLBACK_SITE_LOCALE_CONFIG.defaultLocale;
	const [containerRef, slotWidthPx, slotHeightPx] =
		useContainerPixelWidth<HTMLDivElement>();
	/* DPR snapshotted once via lazy initializer: it never reaches rendered markup (SSR stays
	 * `undefined`), it only feeds `hlsSrc`, which effects apply imperatively. Reading it
	 * synchronously keeps the first `hlsSrc` final, so the measurement gate below attaches
	 * exactly once. Switching displays after load doesn't warrant a manifest reload. */
	const [devicePixelRatio] = useState<number | undefined>(() =>
		typeof window === "undefined" ? undefined : window.devicePixelRatio || 1,
	);
	const videoRef = useRef<HTMLVideoElement>(null);
	const isActiveRef = useRef(isActive);
	isActiveRef.current = isActive;
	const [posterHidden, setPosterHidden] = useState(false);
	const [shouldAttachHls, setShouldAttachHls] = useState(false);
	const reducedMotion = usePrefersReducedMotion();
	/**
	 * Audio toggle state. Always starts `true` (muted) — browser autoplay policy. Flipped
	 * by the overlay control rendered when `allowUnmute === true`. The click counts as the
	 * required user gesture, so the post-toggle `tryPlay()` is allowed to produce sound.
	 */
	const [muted, setMuted] = useState(true);

	/* Safari-autoplay reliability: set `muted` + `defaultMuted` imperatively in
	 * a layout effect, which runs *synchronously after DOM commit* and *before*
	 * any `useEffect` — including the one in `useMuxHlsSource` that assigns
	 * `video.src`. React's `muted` JSX prop alone is unreliable here: under
	 * StrictMode double-mount the property briefly flips between renders, and
	 * Safari's autoplay-engagement heuristic latches the very first state it
	 * sees. If that snapshot is `muted=false` for even a microsecond, Safari
	 * silently denies muted-autoplay for the rest of the page session — and
	 * remembers the denial across reloads via its per-origin engagement
	 * counter (the "plays briefly on first load, never on reload" pattern).
	 * `defaultMuted = true` also serializes back to the HTML `muted` attribute
	 * across `video.load()` cycles, so re-attaches don't reset the state. */
	useLayoutEffect(() => {
		const el = videoRef.current;
		if (!el) return;
		el.muted = true;
		el.defaultMuted = true;
	}, []);

	/* 16×9 when the asset has no video track data (`isFallback`). */
	const {
		width: videoWidthPx,
		height: videoHeightPx,
		isFallback: dimsUnknown,
	} = getMuxDisplayDimensions(media);
	const aspectCss = `${videoWidthPx} / ${videoHeightPx}`;
	const knownDims = dimsUnknown
		? undefined
		: { width: videoWidthPx, height: videoHeightPx };

	const thumbWidthPx = muxThumbnailRequestWidthPx({
		containerWidthPx: slotWidthPx,
		assetMaxWidthPx: knownDims?.width,
	});

	const poster = useMemo(
		() =>
			resolveMediaPosterUrls({
				posterPayload,
				muxMedia: media,
				thumbWidthPx,
				/* The uploaded poster wins, so a video shows the same still everywhere
				 * (accepting a possible one-frame step at the fade). The Mux fallback
				 * stays at t=0, the frame playback starts on. */
				muxTimeSec: 0,
				muxMaxWidthPx: LOOP_POSTER_MAX_WIDTH_PX,
			}),
		[posterPayload, media, thumbWidthPx],
	);

	/* Stall rescue ceiling (see {@link LOOP_STALL_RESCUE_MS}): absolute, so a later resize
	 * can't undo a downgrade by re-picking against a bigger container. */
	const [rescueTierCeiling, setRescueTierCeiling] = useState<
		MuxResolutionTier | undefined
	>(undefined);
	const hlsSrc = useMemo(() => {
		/* Container-aware tier selection: `muxLoopHlsSrc` combines the DPR-
		 * capped container size with `getNetworkAwareTierCeiling()` to pick
		 * the highest tier this device + connection can comfortably serve,
		 * up to the {@link MUX_PLAYBACK_MAX_TIER} = 2160p ceiling, and pins
		 * the manifest's min and max to that single tier so ABR can't ramp
		 * up from a lower rendition. The measurement gate on `attachHls`
		 * keeps the pre-measurement value (bare ceiling) from ever being
		 * attached. Resizing the viewport invalidates this memo and picks a
		 * new tier; in practice resize is rare and the manifest is ~5 kB. */
		return muxLoopHlsSrc(playbackId, {
			videoWidthPx,
			videoHeightPx,
			containerWidthPx: slotWidthPx,
			containerHeightPx: slotHeightPx,
			devicePixelRatio,
			tierCeiling: rescueTierCeiling,
		});
	}, [
		playbackId,
		videoWidthPx,
		videoHeightPx,
		slotWidthPx,
		slotHeightPx,
		devicePixelRatio,
		rescueTierCeiling,
	]);

	const stallTimerRef = useRef<number | undefined>(undefined);
	const disarmStallTimer = useCallback(() => {
		if (stallTimerRef.current !== undefined) {
			window.clearTimeout(stallTimerRef.current);
			stallTimerRef.current = undefined;
		}
	}, []);
	useEffect(() => disarmStallTimer, [disarmStallTimer]);
	/* `waiting` arms the deadline, `playing` / `pause` disarm it. On expiry the pinned tier
	 * steps one rung down; the new `hlsSrc` goes through `useMuxHlsSource`'s normal re-attach,
	 * and the loop restarts from its first frame at the lighter tier. */
	const onVideoWaiting = useCallback(() => {
		if (stallTimerRef.current !== undefined) return;
		stallTimerRef.current = window.setTimeout(() => {
			stallTimerRef.current = undefined;
			const current = resolveMuxLoopTier({
				videoWidthPx,
				videoHeightPx,
				containerWidthPx: slotWidthPx,
				containerHeightPx: slotHeightPx,
				devicePixelRatio,
				tierCeiling: rescueTierCeiling,
			});
			const below = muxTierBelow(current);
			if (below !== current) setRescueTierCeiling(below);
		}, LOOP_STALL_RESCUE_MS);
	}, [
		videoWidthPx,
		videoHeightPx,
		slotWidthPx,
		slotHeightPx,
		devicePixelRatio,
		rescueTierCeiling,
	]);

	/* Attach only once the container measurement and DPR have landed, so the first `hlsSrc`
	 * is the final URL. Without the gate, `useMuxHlsSource` attaches the bare-ceiling URL and
	 * the measured re-render one commit later changes `src` — a full teardown that refetches
	 * the manifest and, on Safari, aborts the first segment mid-flight. The layout-effect
	 * measurement in `useContainerPixelWidth` clears the gate within the mount task. */
	const measurementsReady =
		slotWidthPx !== undefined &&
		slotHeightPx !== undefined &&
		devicePixelRatio !== undefined;
	const [attachFallback, setAttachFallback] = useState(false);
	useEffect(() => {
		if (measurementsReady || attachFallback || !shouldAttachHls) return;
		const t = window.setTimeout(
			() => setAttachFallback(true),
			ATTACH_WITHOUT_MEASUREMENT_MS,
		);
		return () => window.clearTimeout(t);
	}, [measurementsReady, attachFallback, shouldAttachHls]);
	const attachHls = shouldAttachHls && (measurementsReady || attachFallback);
	useMuxHlsSource(videoRef, attachHls ? playbackId : null, hlsSrc, {
		audioEnabled: !muted,
		objectCoverVideoPx: knownDims,
	});

	const tryPlay = useCallback(() => {
		const el = videoRef.current;
		if (!el) return;
		/* Never call play() before the element has a source AND at least
		 * loaded its metadata. The promise rejects with NotAllowedError
		 * otherwise — Safari interprets each such rejection as an autoplay-
		 * abuse signal and decrements the per-origin MediaEngagement score.
		 * After two of these (mount can trigger them: the visibility observer
		 * and the isActive effect both fire before useMuxHlsSource has
		 * assigned `src`) Safari blacklists autoplay for the whole session,
		 * and the *legitimate* canplay-triggered play() then also fails. The
		 * canplay listener is what actually plays the video on Safari — this
		 * guard makes sure we never poison the score before that fires. */
		if (!el.currentSrc && !el.src) return;
		if (el.readyState < HTMLMediaElement.HAVE_METADATA) return;
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
		setMuted(!muted);
		/* Unmuting counts as a user gesture — safe to start playback even under reduced
		 * motion or while the element was paused (e.g. just scrolled into view). Kept outside
		 * the state updater: updaters must stay pure (StrictMode calls them twice). */
		if (muted) {
			queueMicrotask(() => tryPlay());
		}
	}, [muted, tryPlay]);

	/* Poster fade gated on the first PAINTED frame, not on `loadeddata` /
	 * `playing`: both events can fire before the element has composited a
	 * single video frame (an hls.js MSE append counts as "loaded", Safari's
	 * decoder warms up after `playing`). Hiding the poster then fades it into
	 * a still-black element — a visible dark flash, most jarring on a
	 * fullscreen hero where the poster IS the entrance. With
	 * `requestVideoFrameCallback` the crossfade always lands frame-on-frame;
	 * browsers without rVFC keep the previous event-driven behaviour. */
	const posterHideFrameHandle = useRef<number | undefined>(undefined);
	const hidePosterWhenReady = useCallback(() => {
		const el = videoRef.current;
		const supportsRVFC =
			el &&
			typeof (el as HTMLVideoElement & { requestVideoFrameCallback?: unknown })
				.requestVideoFrameCallback === "function";
		if (!el || !supportsRVFC) {
			setPosterHidden(true);
			return;
		}
		if (posterHideFrameHandle.current !== undefined) return;
		posterHideFrameHandle.current = el.requestVideoFrameCallback(() => {
			posterHideFrameHandle.current = undefined;
			setPosterHidden(true);
		});
	}, []);
	useEffect(() => {
		const el = videoRef.current;
		return () => {
			if (el && posterHideFrameHandle.current !== undefined) {
				el.cancelVideoFrameCallback?.(posterHideFrameHandle.current);
			}
		};
	}, []);

	const tryPlayIfActive = useCallback(() => {
		if (reducedMotion) return;
		tryPlay();
	}, [tryPlay, reducedMotion]);

	useEffect(() => {
		const el = videoRef.current;
		if (!el) return;
		if (!isActive) {
			el.pause();
			return;
		}
		if (reducedMotion) return;

		const play = () => {
			/* Same Safari-engagement guard as `tryPlay`. The `canplay` listener
			 * below catches the case where this fires before src is ready. */
			if (!el.currentSrc && !el.src) return;
			if (el.readyState < HTMLMediaElement.HAVE_METADATA) return;
			void el.play().catch(() => {});
		};
		play();
		if (el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
			el.addEventListener("canplay", play, { once: true });
			return () => el.removeEventListener("canplay", play);
		}
	}, [isActive, reducedMotion]);

	useEffect(() => {
		const root = containerRef.current;
		if (!root) return;

		let pauseTimer: number | undefined;
		const io = new IntersectionObserver(
			([entry]) => {
				if (!entry) return;
				if (entry.isIntersecting) {
					if (pauseTimer !== undefined) {
						window.clearTimeout(pauseTimer);
						pauseTimer = undefined;
					}
					setShouldAttachHls(true);
					if (isActive && !reducedMotion) tryPlay();
				} else {
					const el = videoRef.current;
					pauseTimer = window.setTimeout(() => el?.pause(), 100);
				}
			},
			{ rootMargin: "400px", threshold: 0 },
		);
		io.observe(root);
		return () => {
			io.disconnect();
			if (pauseTimer !== undefined) window.clearTimeout(pauseTimer);
		};
	}, [isActive, tryPlay, containerRef, reducedMotion]);

	/* Safari autoplay rescue: Low Power Mode (iOS/macOS) and the per-site "Never Auto-Play"
	 * setting deny even muted `playsinline` autoplay — iOS then draws a struck-through play
	 * glyph and every programmatic `play()` rejects. A real user gesture lifts that for calls
	 * made inside its handler, so the first pointer / key / touch retries `play()` on a visible,
	 * paused loop. The listeners detach after the first `playing`. */
	useEffect(() => {
		if (reducedMotion) return;
		const el = videoRef.current;
		if (!el) return;
		let removed = false;
		const onGesture = () => {
			if (!el.paused) return;
			/* Inactive loops (carousel slides) and off-screen loops stay paused on purpose. */
			if (!isActiveRef.current) return;
			const r = el.getBoundingClientRect();
			if (
				r.width === 0 ||
				r.bottom <= 0 ||
				r.top >= window.innerHeight ||
				r.right <= 0 ||
				r.left >= window.innerWidth
			) {
				return;
			}
			/* Same engagement guard as `tryPlay`. */
			if (!el.currentSrc && !el.src) return;
			if (el.readyState < HTMLMediaElement.HAVE_METADATA) return;
			void el.play().catch(() => {});
		};
		const remove = () => {
			if (removed) return;
			removed = true;
			document.removeEventListener("pointerup", onGesture);
			document.removeEventListener("touchend", onGesture);
			document.removeEventListener("keydown", onGesture);
			el.removeEventListener("playing", remove);
		};
		el.addEventListener("playing", remove);
		document.addEventListener("pointerup", onGesture);
		document.addEventListener("touchend", onGesture);
		document.addEventListener("keydown", onGesture);
		return remove;
	}, [reducedMotion]);

	if (!poster) return null;

	/* Pre-measurement fallback: a literal width — `var()` is invalid inside the `sizes`
	 * grammar, so the entry silently fell back to 100vw. 2000px mirrors
	 * `--content-max-width` (`--breakpoint-wide`); the measured width replaces it one commit
	 * later. */
	const posterSizes = fillParent
		? "100vw"
		: typeof slotWidthPx === "number" && slotWidthPx > 0
			? `${slotWidthPx}px`
			: "(max-width: 900px) 100vw, min(100vw, 2000px)";

	return (
		<div
			ref={containerRef}
			className={clsx(
				"relative w-full overflow-hidden",
				fillParent &&
					"h-full min-h-[100dvh] w-full [&_video]:min-h-full [&_video]:min-w-full [&_video]:object-cover",
				/* Skip layout + paint + style cost while off-screen. The element
				 * keeps its size (we have explicit dimensions / aspect-ratio) so
				 * scroll position stays stable. Above-the-fold heros are visible
				 * at mount → no effect there; below-the-fold body loops get the
				 * full benefit. */
				"[content-visibility:auto]",
				className,
			)}
			style={fillParent ? undefined : { aspectRatio: aspectCss }}
		>
			<video
				ref={videoRef}
				{...knownDims}
				className={clsx(
					/* `object-center` is the CSS default but explicit so the
					 * `[&_video]:object-cover` overrides further up the cascade
					 * don't accidentally introduce a top-left anchor. The video
					 * always crops from both opposite edges equally — the middle
					 * of the frame stays put when the viewport resizes.
					 *
					 * No CSS filters on the video (contrast/saturate/sharpen): a
					 * filter on the video alone shifts it against its own poster,
					 * and perceptual polish belongs in the graded master export. */
					"absolute inset-0 z-0 h-full w-full object-cover object-center",
				)}
				muted
				playsInline
				autoPlay={!reducedMotion}
				loop
				preload={reducedMotion ? "none" : "metadata"}
				disablePictureInPicture
				aria-label={caption || undefined}
				onLoadedData={hidePosterWhenReady}
				/* Native HLS (iPhone) reaches a playable state at `loadedmetadata`
				 * — attempting there keeps the attempt inside the autoplay window
				 * instead of waiting for `canplay`. */
				onLoadedMetadata={tryPlayIfActive}
				onCanPlay={tryPlayIfActive}
				onPlaying={() => {
					disarmStallTimer();
					hidePosterWhenReady();
				}}
				onWaiting={onVideoWaiting}
				onPause={disarmStallTimer}
			/>
			{/* biome-ignore lint/performance/noImgElement: deterministic Sanity / Mux URLs — next/image optimizer would cause SSR/CSR URL drift. */}
			<img
				src={poster.src}
				srcSet={poster.srcSet}
				sizes={poster.srcSet ? posterSizes : undefined}
				alt={caption || ""}
				width={knownDims?.width}
				height={knownDims?.height}
				loading={posterPriority ? "eager" : "lazy"}
				fetchPriority={posterPriority ? "high" : "auto"}
				decoding={posterPriority ? "sync" : "async"}
				className={clsx(
					"pointer-events-none absolute inset-0 z-10 h-full w-full object-cover object-center",
					/* Hiding fades over 700 ms; showing is instant, so a cold fallback
					 * covers a frameless element at once instead of fading in over
					 * black. CSS takes the transition from the state being entered,
					 * so putting it on the hidden state alone gives the asymmetry. */
					posterHidden
						? "opacity-0 transition-opacity duration-700"
						: "opacity-100",
				)}
				aria-hidden={posterHidden ? "true" : undefined}
			/>
			{allowUnmute ? (
				<button
					type="button"
					onClick={onToggleMute}
					aria-label={uiLabel(muted ? "soundOn" : "soundOff", locale)}
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
