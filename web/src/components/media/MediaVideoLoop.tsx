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

import {
	extractMuxPlaybackId,
	getMuxDisplayDimensions,
	LOOP_POSTER_MAX_WIDTH_PX,
	type MuxResolutionTier,
	muxLoopHlsSrc,
	muxThumbnailRequestWidthPx,
	muxTierBelow,
	resolveMuxLoopTier,
} from "@/src/utils/muxPlayback";
import { resolveMediaPosterUrls } from "@/src/utils/resolveMediaPoster";
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
}: MediaVideoLoopProps) {
	const playbackId = extractMuxPlaybackId(media);
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
	 *   - `canplay` lifts to 0.95 — buffered, but the hardware decoder hasn't
	 *     ramped to steady-state yet (first ~30–60 frames can drop on M1 / M2
	 *     while the decode pipeline warms up — exactly the visible jank we're
	 *     here to avoid)
	 *   - `requestVideoFrameCallback` after a handful of painted frames snaps
	 *     to 1.0 — only at that point is playback actually smooth, so only
	 *     then is it safe to dismiss the bridge */
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
		/* Safety net: if no painted frame ever arrives after canplay — autoplay
		 * denied (rare on muted videos but possible), tab backgrounded right at
		 * this moment, decoder error swallowed — don't leave the loading bridge
		 * stuck at 0.95 forever. After this many ms past canplay, force the
		 * snap to 1.0 so the user at least sees the poster + first frame. */
		const FORCE_READY_AFTER_CANPLAY_MS = 1500;
		let forceReadyTimer: number | undefined;
		const onCanPlay = () => {
			emit(0.95);
			if (forceReadyTimer === undefined) {
				forceReadyTimer = window.setTimeout(() => {
					emit(1);
				}, FORCE_READY_AFTER_CANPLAY_MS);
			}
		};

		/* requestVideoFrameCallback fires once per actually-painted video frame.
		 * Counting a few consecutive callbacks is a cheap, accurate signal that
		 * the decode → composite pipeline is producing frames steadily. We don't
		 * measure frame timing — just *that* frames arrive — because by the time
		 * 4 of them have, any decoder ramp-up is over. */
		const STABLE_FRAMES_REQUIRED = 4;
		const supportsRVFC =
			typeof (
				el as HTMLVideoElement & {
					requestVideoFrameCallback?: unknown;
				}
			).requestVideoFrameCallback === "function";
		let rVFCHandle: number | undefined;
		let stableFrameCount = 0;
		const onPaintedFrame = () => {
			stableFrameCount += 1;
			if (stableFrameCount >= STABLE_FRAMES_REQUIRED) {
				emit(1);
				return;
			}
			rVFCHandle = el.requestVideoFrameCallback(onPaintedFrame);
		};
		const onPlaying = () => {
			if (supportsRVFC && rVFCHandle === undefined) {
				rVFCHandle = el.requestVideoFrameCallback(onPaintedFrame);
			}
		};
		/* Fallback for browsers without rVFC (older Firefox): timeupdate fires
		 * ~4× per second once playback advances. currentTime ≥ 0.3 s is a strong
		 * indicator that the decoder is producing frames at a normal cadence. */
		const onTimeUpdateFallback = () => {
			if (supportsRVFC) return;
			if (el.currentTime >= 0.3) emit(1);
		};

		el.addEventListener("loadstart", onLoadStart);
		el.addEventListener("loadedmetadata", onLoadedMetadata);
		el.addEventListener("progress", onProgress);
		el.addEventListener("canplay", onCanPlay);
		el.addEventListener("playing", onPlaying);
		el.addEventListener("timeupdate", onTimeUpdateFallback);
		/* If the video is already past these events at mount (warm HTTP cache),
		 * surface the correct buffered progress immediately. The frame-watcher
		 * still gates the final snap to 1.0 — even on a warm cache the decoder
		 * needs to spin up for this *element* after mount. */
		if (el.readyState >= 3) {
			emit(0.95);
			if (supportsRVFC && !el.paused) {
				rVFCHandle = el.requestVideoFrameCallback(onPaintedFrame);
			}
		} else if (el.readyState >= 1) {
			onLoadedMetadata();
		}
		return () => {
			el.removeEventListener("loadstart", onLoadStart);
			el.removeEventListener("loadedmetadata", onLoadedMetadata);
			el.removeEventListener("progress", onProgress);
			el.removeEventListener("canplay", onCanPlay);
			el.removeEventListener("playing", onPlaying);
			el.removeEventListener("timeupdate", onTimeUpdateFallback);
			if (rVFCHandle !== undefined && supportsRVFC) {
				el.cancelVideoFrameCallback(rVFCHandle);
			}
			if (forceReadyTimer !== undefined) {
				window.clearTimeout(forceReadyTimer);
			}
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

	const poster = useMemo(
		() =>
			playbackId
				? resolveMediaPosterUrls({
						posterPayload,
						muxMedia: media,
						thumbWidthPx,
						/* The uploaded poster wins, so a video shows the same still everywhere
						 * (accepting a possible one-frame step at the fade). The Mux fallback
						 * stays at t=0, the frame playback starts on. */
						muxTimeSec: 0,
						muxMaxWidthPx: LOOP_POSTER_MAX_WIDTH_PX,
					})
				: null,
		[playbackId, posterPayload, media, thumbWidthPx],
	);

	/* Stall rescue ceiling (see {@link LOOP_STALL_RESCUE_MS}): absolute, so a later resize
	 * can't undo a downgrade by re-picking against a bigger container. */
	const [rescueTierCeiling, setRescueTierCeiling] = useState<
		MuxResolutionTier | undefined
	>(undefined);
	const hlsSrc = useMemo(() => {
		if (!playbackId) return "";
		const vw = dims && !dims.isFallback ? dims.width : 16;
		const vh = dims && !dims.isFallback ? dims.height : 9;
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
			videoWidthPx: vw,
			videoHeightPx: vh,
			containerWidthPx: slotWidthPx,
			containerHeightPx: slotHeightPx,
			devicePixelRatio,
			tierCeiling: rescueTierCeiling,
		});
	}, [
		playbackId,
		dims,
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
		if (stallTimerRef.current !== undefined || !playbackId) return;
		stallTimerRef.current = window.setTimeout(() => {
			stallTimerRef.current = undefined;
			const current = resolveMuxLoopTier({
				videoWidthPx: dims && !dims.isFallback ? dims.width : 16,
				videoHeightPx: dims && !dims.isFallback ? dims.height : 9,
				containerWidthPx: slotWidthPx,
				containerHeightPx: slotHeightPx,
				devicePixelRatio,
				tierCeiling: rescueTierCeiling,
			});
			const below = muxTierBelow(current);
			if (below !== current) setRescueTierCeiling(below);
		}, LOOP_STALL_RESCUE_MS);
	}, [
		playbackId,
		dims,
		slotWidthPx,
		slotHeightPx,
		devicePixelRatio,
		rescueTierCeiling,
	]);

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
	const attachHls =
		shouldAttachHls &&
		(measurementsReady || attachFallback) &&
		Boolean(playbackId);
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
		/* Never call play() before the element has a source AND at least
		 * loaded its metadata. The promise rejects with NotAllowedError
		 * otherwise — Safari interprets each such rejection as an autoplay-
		 * abuse signal and decrements the per-origin MediaEngagement score.
		 * After two of these (which mount currently triggers — useLayoutEffect
		 * tryPlay + the isActive effect both fire before useMuxHlsSource has
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
		if (stackedSlide && !isActiveRef.current) return;
		const el = videoRef.current;
		const supportsRVFC =
			el &&
			typeof (el as HTMLVideoElement & { requestVideoFrameCallback?: unknown })
				.requestVideoFrameCallback === "function";
		if (!el || !supportsRVFC) {
			setPosterHidden(true);
			emitLoadedOnce();
			return;
		}
		if (posterHideFrameHandle.current !== undefined) return;
		posterHideFrameHandle.current = el.requestVideoFrameCallback(() => {
			posterHideFrameHandle.current = undefined;
			/* Activation may have changed between arming and the frame paint
			 * (stacked slide deactivated → its pending callback fires on the
			 * next play) — re-check so a background slide keeps its poster. */
			if (stackedSlide && !isActiveRef.current) return;
			setPosterHidden(true);
			emitLoadedOnce();
		});
	}, [emitLoadedOnce, stackedSlide]);
	useEffect(() => {
		const el = videoRef.current;
		return () => {
			if (el && posterHideFrameHandle.current !== undefined) {
				el.cancelVideoFrameCallback?.(posterHideFrameHandle.current);
			}
		};
	}, []);

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
		/* Stacked intro slides always restart on activation (manual pick or auto-advance). */
		if (stackedSlide || el.ended) {
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
	}, [isActive, reducedMotion, stackedSlide]);

	useEffect(() => {
		if (skipVisibilityGate) return;
		const root = containerRef.current;
		if (!root || !playbackId) return;

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
	}, [
		playbackId,
		isActive,
		tryPlay,
		containerRef,
		skipVisibilityGate,
		reducedMotion,
	]);

	/* Safari autoplay rescue: Low Power Mode (iOS/macOS) and the per-site "Never Auto-Play"
	 * setting deny even muted `playsinline` autoplay — iOS then draws a struck-through play
	 * glyph and every programmatic `play()` rejects. A real user gesture lifts that for calls
	 * made inside its handler, so the first pointer / key / touch retries `play()` on a visible,
	 * paused loop. The listeners detach after the first `playing`. */
	useEffect(() => {
		if (reducedMotion || !playbackId) return;
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
	}, [reducedMotion, playbackId]);

	if (!playbackId || !poster) {
		return null;
	}

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
					 * of the frame stays put when the viewport resizes.
					 *
					 * No CSS filters on the video (contrast/saturate/sharpen): a
					 * filter on the video alone shifts it against its own poster,
					 * and perceptual polish belongs in the graded master export. */
					"absolute inset-0 z-0 h-full w-full object-cover object-center",
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
					aria-label={muted ? "Turn sound on" : "Turn sound off"}
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
