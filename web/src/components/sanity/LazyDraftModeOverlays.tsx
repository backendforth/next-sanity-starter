"use client";

import dynamic from "next/dynamic";

/**
 * `@sanity/visual-editing` is ~800 KB raw, the largest thing that can reach the client graph.
 * Next preloads every client chunk a route can reach as `<script async>`, so a conditional
 * render in the server layout still ships it to every visitor. A lazy client boundary with
 * `ssr: false` requests the module only when this component mounts, i.e. in Draft Mode.
 */
const DraftModeOverlays = dynamic(
	() =>
		import("@/src/components/sanity/DraftModeOverlays").then(
			(m) => m.DraftModeOverlays,
		),
	{ ssr: false },
);

export function LazyDraftModeOverlays() {
	return <DraftModeOverlays />;
}
