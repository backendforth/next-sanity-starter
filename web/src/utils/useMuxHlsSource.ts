"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";

import {
	computeLoopVideoTarget,
	computeObjectCoverTargetPx,
	detectMuxLevelCodecFamily,
	getPreferredVideoCodec,
	type MuxLevelCodecFamily,
	pickMuxHlsLevelIndex,
} from "@/src/utils/muxPlayback";

/** Map our codec-family enum to the hls.js `videoPreference.videoCodec` string. */
function muxCodecFamilyToHlsPreference(
	family: MuxLevelCodecFamily,
): "av01" | "hvc1" | "avc1" {
	if (family === "av1") return "av01";
	if (family === "hevc") return "hvc1";
	return "avc1";
}

type HlsInstance = InstanceType<typeof import("hls.js")["default"]>;

type UseMuxHlsSourceOptions = {
	/**
	 * When `false`, deselects the active audio track via `hls.audioTrack = -1`.
	 * hls.js then stops requesting audio segments — saves the audio bandwidth for
	 * muted-by-default loops where the visitor never unmutes. Re-enabling later
	 * (the visitor clicks unmute) re-selects track 0 and audio starts loading
	 * within ~1–2 s.
	 *
	 * Only takes effect with the hls.js backend; Native HLS (Safari/iOS) keeps
	 * default behavior because the platform manages audio tracks itself.
	 */
	audioEnabled?: boolean;
	/**
	 * Prefer AV1 → HEVC → H.264 renditions when the manifest and browser support
	 * them. Only used by {@link MediaVideoLoop} — other players keep default ABR.
	 */
	preferModernCodecs?: boolean;
	/**
	 * Use {@link computeObjectCoverTargetPx} for level selection (loops with
	 * `object-fit: cover`). Requires {@link objectCoverVideoPx}.
	 */
	useObjectCoverPick?: boolean;
	/** Intrinsic video size — paired with `useObjectCoverPick`. */
	objectCoverVideoPx?: { width: number; height: number };
	/**
	 * Short silent loops: minimal ahead-buffer, locked level (no ABR upswitch),
	 * 1440p ceiling.
	 */
	tuneForShortLoop?: boolean;
	/** When true, hls.js stops fetching segments (stacked carousel inactive slide). */
	loadingPaused?: boolean;
};

/**
 * Attach a Mux HLS (`.m3u8`) source to a `<video>` element.
 *
 * Prefers **`hls.js`** (MSE, level cap to player size, tuned ABR). Falls back to **native HLS**
 * (Safari / iOS). `hls.js` is imported lazily so it only ships when a loop video is used.
 *
 * @see https://docs.mux.com/guides/control-playback-resolution — rationale for
 *   `rendition_order=desc` used in {@link muxHlsSrc}.
 */
export function useMuxHlsSource(
	videoRef: RefObject<HTMLVideoElement | null>,
	playbackId: string | null,
	src: string,
	opts: UseMuxHlsSourceOptions = {},
): void {
	const audioEnabled = opts.audioEnabled !== false;
	const preferModernCodecs = opts.preferModernCodecs === true;
	const useObjectCoverPick = opts.useObjectCoverPick === true;
	const tuneForShortLoop = opts.tuneForShortLoop === true;
	const loadingPaused = opts.loadingPaused === true;
	const hlsRef = useRef<HlsInstance | null>(null);
	/* Exposed by the lifecycle effect so the ResizeObserver effect can re-pick
	 * the rendition without rebuilding hls. `null` until the manifest is parsed
	 * and after `detach()`. */
	const applyPickRef = useRef<
		((opts?: { upgradeOnly?: boolean }) => void) | null
	>(null);
	/* Mirror volatile opts into refs so the lifecycle effect dep list stays fixed
	 * (React warns when dep array length changes across HMR / renders). */
	const audioEnabledRef = useRef(audioEnabled);
	audioEnabledRef.current = audioEnabled;
	const preferModernCodecsRef = useRef(preferModernCodecs);
	preferModernCodecsRef.current = preferModernCodecs;
	const useObjectCoverPickRef = useRef(useObjectCoverPick);
	useObjectCoverPickRef.current = useObjectCoverPick;
	const objectCoverVideoPxRef = useRef(opts.objectCoverVideoPx);
	objectCoverVideoPxRef.current = opts.objectCoverVideoPx;
	const tuneForShortLoopRef = useRef(tuneForShortLoop);
	tuneForShortLoopRef.current = tuneForShortLoop;
	const loadingPausedRef = useRef(loadingPaused);
	loadingPausedRef.current = loadingPaused;

	useEffect(() => {
		const video = videoRef.current;
		if (!playbackId || !video) return;

		let cancelled = false;
		let hls: HlsInstance | null = null;
		let mediaErrorRecoveryAttempted = false;
		const excludedCodecFamilies = new Set<MuxLevelCodecFamily>();

		const detach = () => {
			if (hls) {
				hls.destroy();
				hls = null;
			}
			hlsRef.current = null;
			applyPickRef.current = null;
			video.removeAttribute("src");
			video.load();
		};

		const syncAudioTrack = () => {
			if (!hls) return;
			const tracks = hls.audioTracks;
			if (!tracks || tracks.length === 0) return;
			if (audioEnabledRef.current) {
				if (hls.audioTrack < 0) hls.audioTrack = 0;
			} else if (hls.audioTrack >= 0) {
				hls.audioTrack = -1;
			}
		};

		/* Safari native-HLS fast path. Skips the hls.js dynamic import (~50–100 KB
		 * the browser would never use anyway) AND the MediaCapabilities codec
		 * probe (only relevant for hls.js level picking — Safari does its own
		 * rendition selection internally). Setting `video.src` synchronously
		 * inside this effect means it lands inside the page-load autoplay
		 * window; the previous async path delayed src by 200–500 ms, often
		 * past the window — Safari then denied muted-autoplay silently and the
		 * loading bridge waited for frames that never arrived. */
		if (video.canPlayType("application/vnd.apple.mpegurl")) {
			video.src = src;
			/* Register the same cleanup as the hls.js path. Without this, an
			 * effect re-run (StrictMode double-mount in dev, `src`-memo change
			 * in prod) would leave the previous src in place — Safari then
			 * re-loads on top of an already-loading element, which is the
			 * "plays briefly then stops" failure mode. */
			return () => {
				cancelled = true;
				detach();
			};
		}

		/* Wait for both hls.js and the codec probe in parallel. The probe runs a
		 * MediaCapabilities check (~10–50 ms) — when the device can't decode AV1
		 * smoothly + power-efficiently (e.g. M1 / M2 — no HW AV1 decoder) it
		 * returns "hevc" so HEVC HW decode wins over software AV1. On M3+ /
		 * recent x86 with HW AV1 the probe stays at "av1" → unchanged behaviour. */
		const preferModern = preferModernCodecsRef.current;
		void Promise.all([
			import("hls.js"),
			preferModern
				? getPreferredVideoCodec()
				: Promise.resolve<MuxLevelCodecFamily | null>(null),
		]).then(([{ default: Hls }, preferredCodec]) => {
			if (cancelled) return;

			if (Hls.isSupported()) {
				const loopTuned = tuneForShortLoopRef.current;
				hls = new Hls({
					capLevelToPlayerSize: true,
					ignoreDevicePixelRatio: !loopTuned,
					...(preferModern && preferredCodec
						? {
								videoPreference: {
									videoCodec: muxCodecFamilyToHlsPreference(preferredCodec),
									allowedVideoRanges: ["SDR"],
								},
							}
						: {}),
					...(loopTuned
						? {
								maxBufferLength: 3,
								maxMaxBufferLength: 6,
								maxBufferSize: 8 * 1000 * 1000,
								abrEwmaDefaultEstimate: 4_000_000,
								startFragPrefetch: false,
								abrBandWidthFactor: 0,
								abrBandWidthUpFactor: 0,
							}
						: {
								abrEwmaDefaultEstimate: 50_000_000,
								maxBufferLength: 20,
								maxBufferSize: 100 * 1000 * 1000,
								progressive: true,
							}),
					backBufferLength: 0,
					fragLoadingMaxRetry: 6,
					levelLoadingMaxRetry: 4,
				});
				/* Force the first segment at the smallest level that still saturates the
				 * player size (DPR-aware). Without this hls.js ramps up from a low level
				 * and the viewer sees a visible quality step-up after a few seconds.
				 *
				 * When `preferModernCodecs` is on, filter by AV1 → HEVC → H.264 before
				 * applying the resolution pick so multi-codec manifests don't default to AVC.
				 *
				 * `upgradeOnly` is set by the ResizeObserver path: a container that grew
				 * gets a higher rendition; a container that shrunk keeps the current one
				 * (no point wasting the already-buffered higher-quality segments). */
				const applyPick = (pickOpts?: { upgradeOnly?: boolean }) => {
					if (!hls) return;
					const levels = hls.levels;
					if (!levels?.length) return;
					const cw = video.clientWidth || window.innerWidth || 0;
					const ch = video.clientHeight || window.innerHeight || 0;
					let targetW = cw * (window.devicePixelRatio || 1);
					let targetH = ch * (window.devicePixelRatio || 1);
					const videoPx = objectCoverVideoPxRef.current;
					if (
						useObjectCoverPickRef.current &&
						videoPx?.width &&
						videoPx?.height
					) {
						if (tuneForShortLoopRef.current) {
							({ targetW, targetH } = computeLoopVideoTarget({
								containerWidthPx: cw,
								containerHeightPx: ch,
								devicePixelRatio: window.devicePixelRatio,
								videoWidthPx: videoPx.width,
								videoHeightPx: videoPx.height,
							}));
						} else {
							({ targetW, targetH } = computeObjectCoverTargetPx({
								containerWidthPx: cw,
								containerHeightPx: ch,
								devicePixelRatio: window.devicePixelRatio || 1,
								videoWidthPx: videoPx.width,
								videoHeightPx: videoPx.height,
							}));
						}
					}
					const pick = pickMuxHlsLevelIndex(levels, {
						targetW,
						targetH,
						preferModernCodecs: preferModernCodecsRef.current,
						excludedFamilies: excludedCodecFamilies,
						preferredCodec: preferredCodec ?? undefined,
					});
					if (typeof pick !== "number") return;
					if (pickOpts?.upgradeOnly) {
						const currentIdx = hls.currentLevel;
						if (currentIdx >= 0) {
							const currentH = levels[currentIdx]?.height ?? 0;
							const nextH = levels[pick]?.height ?? 0;
							if (nextH <= currentH) return;
						}
					}
					if (hls.currentLevel === pick && hls.nextLevel === pick) return;
					hls.startLevel = pick;
					if (loopTuned) {
						hls.nextLevel = pick;
						hls.currentLevel = pick;
						hls.autoLevelCapping = pick;
					} else {
						hls.autoLevelCapping = -1;
						hls.nextLevel = pick;
						hls.currentLevel = pick;
					}
				};
				applyPickRef.current = applyPick;
				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					applyPick();
					syncAudioTrack();
					if (loadingPausedRef.current) {
						hls?.stopLoad();
					}
				});
				hls.on(Hls.Events.ERROR, (_, data) => {
					if (!data.fatal || !hls) return;
					if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
						hls.startLoad();
					} else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
						if (!mediaErrorRecoveryAttempted) {
							mediaErrorRecoveryAttempted = true;
							hls.recoverMediaError();
							return;
						}
						if (preferModernCodecsRef.current) {
							const current = hls.levels[hls.currentLevel];
							const family = detectMuxLevelCodecFamily(current?.codecs);
							if (family) excludedCodecFamilies.add(family);
							applyPick();
							mediaErrorRecoveryAttempted = false;
							hls.startLoad();
							return;
						}
						hls.recoverMediaError();
					} else {
						hls.destroy();
						hls = null;
						if (!cancelled) {
							video.src = src;
						}
					}
				});
				if (cancelled) {
					hls.destroy();
					hls = null;
					return;
				}
				hls.loadSource(src);
				hls.attachMedia(video);
				hlsRef.current = hls;
				return;
			}

			if (cancelled) return;
			video.src = src;
		});

		return () => {
			cancelled = true;
			detach();
		};
	}, [playbackId, src, videoRef]);

	/* Toggle audio post-mount without rebuilding hls. When the manifest hasn't
	 * been parsed yet the call is a no-op; MANIFEST_PARSED applies the latest
	 * `audioEnabledRef` value when it fires. */
	useEffect(() => {
		const hls = hlsRef.current;
		if (!hls) return;
		const tracks = hls.audioTracks;
		if (!tracks || tracks.length === 0) return;
		if (audioEnabled) {
			if (hls.audioTrack < 0) hls.audioTrack = 0;
		} else if (hls.audioTrack >= 0) {
			hls.audioTrack = -1;
		}
	}, [audioEnabled]);

	/* Pause segment fetches without tearing down the MSE pipeline (carousel slides). */
	useEffect(() => {
		const hls = hlsRef.current;
		if (!hls) return;
		if (loadingPaused) {
			hls.stopLoad();
		} else {
			hls.startLoad();
		}
	}, [loadingPaused]);

	/* Re-pick the rendition when the video element resizes — but only when the
	 * resize *increased* the player size. Debounced to the trailing edge of a
	 * resize gesture so window-drag doesn't fire a flurry of level switches.
	 * Downscaling is intentionally ignored: the higher-quality segments are
	 * already buffered, swapping down would waste them. */
	useEffect(() => {
		if (
			typeof window === "undefined" ||
			typeof ResizeObserver === "undefined"
		) {
			return;
		}
		const video = videoRef.current;
		if (!video) return;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const ro = new ResizeObserver(() => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				applyPickRef.current?.({ upgradeOnly: true });
			}, 250);
		});
		ro.observe(video);
		return () => {
			ro.disconnect();
			if (timer) clearTimeout(timer);
		};
	}, [videoRef]);
}
