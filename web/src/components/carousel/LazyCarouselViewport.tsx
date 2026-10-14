"use client";

import dynamic from "next/dynamic";

/**
 * Embla (`embla-carousel-react` + autoplay) and the slide components load only on pages that
 * render a carousel. SSR stays on, so the first paint includes the static slide markup.
 */
export const LazyCarouselViewport = dynamic(() =>
	import("./CarouselViewport").then((m) => m.CarouselViewport),
);
