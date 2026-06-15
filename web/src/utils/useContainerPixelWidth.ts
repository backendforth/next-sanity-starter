"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

/**
 * Tracks the container’s CSS pixel width and height (after mount via `useEffect`).
 * For `next/image` `sizes`, combine with a client-only guard (see `MediaImage`) so SSR and
 * the first client render stay identical and avoid hydration mismatches.
 */
export function useContainerPixelWidth<T extends HTMLElement>(): [
	RefObject<T | null>,
	number | undefined,
	number | undefined,
] {
	const ref = useRef<T | null>(null);
	const [widthPx, setWidthPx] = useState<number | undefined>(undefined);
	const [heightPx, setHeightPx] = useState<number | undefined>(undefined);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const measure = () => {
			const rect = el.getBoundingClientRect();
			if (rect.width > 0) setWidthPx(Math.ceil(rect.width));
			if (rect.height > 0) setHeightPx(Math.ceil(rect.height));
		};

		measure();

		const ro = new ResizeObserver((entries) => {
			const rect = entries[0]?.contentRect;
			if (!rect) return;
			if (rect.width > 0) setWidthPx(Math.ceil(rect.width));
			if (rect.height > 0) setHeightPx(Math.ceil(rect.height));
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	return [ref, widthPx, heightPx];
}
