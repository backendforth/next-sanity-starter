"use client";

import { useIsPresentationTool } from "next-sanity/hooks";

export function DisableDraftMode() {
	const isPresentationTool = useIsPresentationTool();

	if (isPresentationTool) {
		return null;
	}

	return (
		<a
			href="/api/draft-mode/disable"
			className="fixed right-4 bottom-4 z-50 rounded-full bg-color-text px-4 py-2 text-sm text-color-bg"
		>
			Disable Draft Mode
		</a>
	);
}
