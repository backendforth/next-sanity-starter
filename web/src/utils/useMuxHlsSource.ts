import type { RefObject } from "react";
import { useEffect } from "react";

import {
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

/**
 * Must this browser play HLS from a plain `<video src>` — i.e. is there no
 * Media Source Extensions for hls.js to drive?
 *
 * hls.js is the preferred backend EVERYWHERE it can run, desktop Safari
 * included: it is the only path with level control under our own pick
 * ({@link pickMuxHlsLevelIndex}) and a bounded buffer budget. Native HLS has
 * neither — Safari's own ABR decides the ramp and `preload` is the only knob.
 * So native is the fallback ONLY where classic `MediaSource` is missing:
 * iPhone (`ManagedMediaSource` alone is deliberately not enough — see
 * `preferManagedMediaSource` below) and very old engines.
 *
 * `canPlayType("application/vnd.apple.mpegurl")` alone is NOT the signal:
 * Chromium returns the truthy `"maybe"` for the HLS MIME types (verified on
 * Chrome 151, macOS — it answers `"maybe"` for `video/mp4` just as readily)
 * while it cannot play the stream. A truthy result sent every Chrome visitor
 * down the native path, where `video.src = <m3u8>` ends in
 * `MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED` (code 4) and no loop ever played.
 * Checking for the absence of `MediaSource` first keeps Chromium (and
 * desktop Safari) on hls.js regardless of what `canPlayType` says.
 */
function needsNativeHlsPlayback(video: HTMLVideoElement): boolean {
	if (typeof window === "undefined") return false;
	if (typeof window.MediaSource !== "undefined") return false;
	return Boolean(video.canPlayType("application/vnd.apple.mpegurl"));
}

/**
 * Attach a Mux HLS (`.m3u8`) source to a `<video>` element, tuned for short silent loops:
 * AV1 → HEVC → H.264 renditions where the manifest and browser support them, a locked level
 * (no ABR upswitch) and a loop-sized buffer.
 *
 * Prefers **`hls.js`** (MSE) — on desktop Safari too.
 * Falls back to **native HLS** only where MSE is missing (iPhone). `hls.js` is imported
 * lazily so it only ships when a loop video is used.
 *
 * @see https://docs.mux.com/guides/control-playback-resolution — rationale for
 *   `rendition_order=desc` used in {@link muxLoopHlsSrc}.
 */
export function useMuxHlsSource(
	videoRef: RefObject<HTMLVideoElement | null>,
	playbackId: string | null,
	src: string,
): void {
	useEffect(() => {
		const video = videoRef.current;
		if (!playbackId || !video) return;

		let cancelled = false;
		let hls: HlsInstance | null = null;
		let mediaErrorRecoveryAttempted = false;
		let fatalNetworkRetries = 0;
		const excludedCodecFamilies = new Set<MuxLevelCodecFamily>();

		const detach = () => {
			if (hls) {
				hls.destroy();
				hls = null;
			}
			video.removeAttribute("src");
			video.load();
		};

		/* Native-HLS fallback (iPhone — no MSE). Skips the hls.js dynamic import
		 * (~50–100 KB the browser would never use anyway) AND the
		 * MediaCapabilities codec probe (only relevant for hls.js level picking
		 * — the native player does its own rendition selection internally).
		 * Setting `video.src` synchronously inside this effect means it lands
		 * inside the page-load autoplay window; an async src delayed it by
		 * 200–500 ms, often past the window — iOS then denied muted-autoplay
		 * silently and the element waited for frames that never arrived.
		 *
		 * Gated on {@link needsNativeHlsPlayback}, NOT on `canPlayType` alone —
		 * Chromium answers `"maybe"` without being able to play the stream. */
		if (needsNativeHlsPlayback(video)) {
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
		const ready = Promise.all([import("hls.js"), getPreferredVideoCodec()]);
		void ready.then(([{ default: Hls }, preferredCodec]) => {
			if (cancelled) return;

			if (Hls.isSupported()) {
				hls = new Hls({
					/* Classic MSE, also on Safari 17+ where `ManagedMediaSource`
					 * exists: MMS lets the browser gate segment loading
					 * (`startstreaming` / `endstreaming`), which would undercut the
					 * deterministic level pin below.
					 * Desktop Safari has plain `MediaSource`; iPhone has only MMS and
					 * takes the native path above anyway. */
					preferManagedMediaSource: false,
					videoPreference: {
						videoCodec: muxCodecFamilyToHlsPreference(preferredCodec),
						allowedVideoRanges: ["SDR"],
					},
					/* Loops must replay from MSE, not the network. Budgets are
					 * sized against the heaviest real rendition (Mux premium
					 * 2160p H.264: ~31 Mbps in 4 s segments ~ 20 MB each): a
					 * ~2-segment lookahead absorbs bandwidth dips, and the back
					 * buffer keeps the whole clip so the loop wrap (and carousel
					 * A -> B -> A re-activation) costs zero bytes. With budgets
					 * below one segment (the previous 3 s / 8 MB) hls.js fetched
					 * just-in-time and `backBufferLength: 0` evicted behind the
					 * playhead — every cycle re-downloaded the entire clip
					 * (~30 Mbps per visitor, forever). */
					maxBufferLength: 8,
					maxMaxBufferLength: 16,
					maxBufferSize: 64 * 1000 * 1000,
					backBufferLength: 30,
					abrEwmaDefaultEstimate: 4_000_000,
					startFragPrefetch: false,
					abrBandWidthFactor: 0,
					abrBandWidthUpFactor: 0,
					fragLoadingMaxRetry: 6,
					levelLoadingMaxRetry: 4,
				});
				/* Lock the level before the first segment. `muxLoopHlsSrc` pins the manifest to one
				 * tier, so this picks the codec: AV1 → HEVC → H.264 as the device decodes them,
				 * minus families that failed with a media error. */
				const applyPick = () => {
					if (!hls?.levels.length) return;
					const pick = pickMuxHlsLevelIndex(hls.levels, {
						excludedFamilies: excludedCodecFamilies,
						preferredCodec,
					});
					if (pick === undefined) return;
					if (hls.currentLevel === pick && hls.nextLevel === pick) return;
					hls.startLevel = pick;
					hls.nextLevel = pick;
					hls.currentLevel = pick;
					hls.autoLevelCapping = pick;
				};
				hls.on(Hls.Events.MANIFEST_PARSED, applyPick);
				hls.on(Hls.Events.ERROR, (_, data) => {
					if (!data.fatal || !hls) return;
					if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
						/* hls.js already retried per-request (fragLoadingMaxRetry /
						 * levelLoadingMaxRetry) before escalating to fatal — a bounded
						 * number of full restarts is the last resort, not an infinite
						 * hammer against a dead endpoint (ad-blocker, offline). */
						if (fatalNetworkRetries < 3) {
							fatalNetworkRetries += 1;
							hls.startLoad();
						}
					} else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
						if (!mediaErrorRecoveryAttempted) {
							mediaErrorRecoveryAttempted = true;
							hls.recoverMediaError();
							return;
						}
						const current = hls.levels[hls.currentLevel];
						const family = detectMuxLevelCodecFamily(current?.codecs);
						if (family) excludedCodecFamilies.add(family);
						applyPick();
						mediaErrorRecoveryAttempted = false;
						hls.startLoad();
					} else {
						/* Unrecoverable (KEY/MUX/OTHER): tear down hls and fall back to a
						 * native src. */
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
}
