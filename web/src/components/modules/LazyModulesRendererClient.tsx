"use client";

import dynamic from "next/dynamic";

/**
 * The Presentation reorder (`useOptimistic` from `next-sanity/hooks`, part of
 * `@sanity/visual-editing`), rendered only in Draft Mode. SSR on: same markup in both modes.
 */
export const LazyModulesRendererClient = dynamic(() =>
	import("./ModulesRendererClient").then((m) => m.ModulesRendererClient),
);
