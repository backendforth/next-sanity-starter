"use client";

import dynamic from "next/dynamic";

/*
 * The video players — Mux Player, the hls.js loop and their helpers — load only on pages that
 * render one. A server component importing them directly would put them in every route's
 * first-load JS; a lazy client boundary splits them into their own chunk. SSR stays on, so the
 * poster markup is still in the first paint. Images stay static (`MediaImage`): they are the
 * usual LCP element.
 */

export const LazyMediaVideo = dynamic(() =>
	import("./MediaVideo").then((m) => m.MediaVideo),
);

export const LazyMediaVideoLoop = dynamic(() =>
	import("./MediaVideoLoop").then((m) => m.MediaVideoLoop),
);
