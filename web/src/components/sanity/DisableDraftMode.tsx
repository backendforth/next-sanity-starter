"use client";

import { useIsPresentationTool } from "next-sanity/hooks";
import { useEffect } from "react";

/**
 * Drafts are for the Presentation preview only. A top-level page that Presentation does not
 * drive (`false`, not the `null` "still detecting" state) leaves Draft Mode through a full
 * navigation, so it re-renders on the server with published content.
 *
 * Inside a frame or a window another page opened, `false` only means the handshake has not
 * finished: `<VisualEditing />` reports it after one second without a connection, and the Studio
 * can take longer (it may itself sit in the Sanity Dashboard's frame). Leaving Draft Mode there
 * would cut Presentation off, and in its cross-site iframe the disable route cannot even clear
 * the partitioned cookie — so nothing happens.
 */
export function DisableDraftMode() {
	const isPresentationTool = useIsPresentationTool();

	useEffect(() => {
		if (isPresentationTool !== false) return;
		if (window.self !== window.top || window.opener) return;
		const { pathname, search, hash } = window.location;
		const target = `${pathname}${search}${hash}`;
		window.location.href = `/api/draft-mode/disable?redirect=${encodeURIComponent(target)}`;
	}, [isPresentationTool]);

	return null;
}
