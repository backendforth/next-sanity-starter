"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

/**
 * Tracks the container’s CSS pixel width (after mount via `useEffect`).
 * For `next/image` `sizes`, combine with a client-only guard (see `MediaImage`) so SSR and
 * the first client render stay identical and avoid hydration mismatches.
 */
export function useContainerPixelWidth<T extends HTMLElement>(): [
	RefObject<T | null>,
	number | undefined,
] {
	const ref = useRef<T | null>(null);
	const [widthPx, setWidthPx] = useState<number | undefined>(undefined);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const measure = () => {
			const w = el.getBoundingClientRect().width;
			if (w > 0) setWidthPx(Math.ceil(w));
		};

		measure();

		const ro = new ResizeObserver((entries) => {
			const w = entries[0]?.contentRect.width;
			if (typeof w === "number" && w > 0) setWidthPx(Math.ceil(w));
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	return [ref, widthPx];
}
