"use client";

import { useIsPresentationTool } from "next-sanity/hooks";
import { useEffect } from "react";

/**
 * Drafts are for the Presentation preview only. Once the page is confirmed to run outside the
 * Presentation tool (`false`, not the `null` "still detecting" state), Draft Mode is switched
 * off through a full navigation, so the page re-renders on the server with published content.
 * Inside Presentation (iframe or "open preview" window) nothing happens.
 */
export function DisableDraftMode() {
	const isPresentationTool = useIsPresentationTool();

	useEffect(() => {
		if (isPresentationTool !== false) return;
		const { pathname, search, hash } = window.location;
		const target = `${pathname}${search}${hash}`;
		window.location.href = `/api/draft-mode/disable?redirect=${encodeURIComponent(target)}`;
	}, [isPresentationTool]);

	return null;
}
