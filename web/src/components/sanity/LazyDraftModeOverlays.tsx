"use client";

import dynamic from "next/dynamic";

/** `@sanity/visual-editing` (~800 KB raw), requested only when Draft Mode mounts this. */
export const LazyDraftModeOverlays = dynamic(
	() => import("./DraftModeOverlays").then((m) => m.DraftModeOverlays),
	{ ssr: false },
);
