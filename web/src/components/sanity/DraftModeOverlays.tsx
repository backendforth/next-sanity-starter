"use client";

import { VisualEditing } from "next-sanity/visual-editing";

import { DisableDraftMode } from "@/src/components/sanity/DisableDraftMode";

/**
 * The client pieces of Draft Mode, in one module so `LazyDraftModeOverlays` can load both
 * behind a single lazy boundary. They travel together: `DisableDraftMode` reaches
 * `@sanity/visual-editing/react` through `next-sanity/hooks`, so splitting off only
 * `VisualEditing` would leave the whole package in the published graph.
 */
export function DraftModeOverlays() {
	return (
		<>
			<VisualEditing />
			<DisableDraftMode />
		</>
	);
}
