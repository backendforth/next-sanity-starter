"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

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
): void {
	useEffect(() => {
		const video = videoRef.current;
		if (!playbackId || !video) return;

		let cancelled = false;
		let hls: InstanceType<typeof import("hls.js")["default"]> | null = null;

		const detach = () => {
			if (hls) {
				hls.destroy();
				hls = null;
			}
			video.removeAttribute("src");
			video.load();
		};

		void import("hls.js").then(({ default: Hls }) => {
			if (cancelled) return;

			if (Hls.isSupported()) {
				hls = new Hls({
					capLevelToPlayerSize: true,
					ignoreDevicePixelRatio: false,
					abrEwmaDefaultEstimate: 5_000_000,
					maxBufferLength: 60,
				});
				hls.on(Hls.Events.ERROR, (_, data) => {
					if (!data.fatal || !hls) return;
					if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
						hls.startLoad();
					} else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
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
