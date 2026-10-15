"use client";

import dynamic from "next/dynamic";

/*
 * Mux Player, the hls.js loop and their helpers, only on pages that render a video. SSR on, so
 * the poster is in the first paint. Images stay static (`MediaImage`): they are the usual LCP.
 */

export const LazyMediaVideo = dynamic(() =>
	import("./MediaVideo").then((m) => m.MediaVideo),
);

export const LazyMediaVideoLoop = dynamic(() =>
	import("./MediaVideoLoop").then((m) => m.MediaVideoLoop),
);
