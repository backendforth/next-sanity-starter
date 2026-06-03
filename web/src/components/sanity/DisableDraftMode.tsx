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
			className="fixed right-sm bottom-sm z-50 rounded-full bg-color-text px-min py-min text-sm text-color-bg"
		>
			Disable Draft Mode
		</a>
	);
}
