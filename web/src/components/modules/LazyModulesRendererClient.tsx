"use client";

import dynamic from "next/dynamic";

/**
 * `ModulesRendererClient` reorders modules optimistically while an editor works in
 * Presentation. Its `useOptimistic` comes from `next-sanity/hooks`, which pulls in part of
 * `@sanity/visual-editing` — ~20 KB gzip no visitor outside Draft Mode needs. Rendered only in
 * Draft Mode, this lazy boundary keeps it out of every route's first-load JS. SSR stays on, so
 * the server markup is the same in both modes.
 */
export const LazyModulesRendererClient = dynamic(() =>
	import("./ModulesRendererClient").then((m) => m.ModulesRendererClient),
);
