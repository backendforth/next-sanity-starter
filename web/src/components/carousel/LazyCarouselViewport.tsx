"use client";

import dynamic from "next/dynamic";

/** Embla and the slide components, only on pages with a carousel. SSR on: slides in first paint. */
export const LazyCarouselViewport = dynamic(() =>
	import("./CarouselViewport").then((m) => m.CarouselViewport),
);
