"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

/**
 * Tracks the container’s CSS pixel width so `sizes` on `next/image` matches the real slot
 * (browser then picks the closest `srcset` candidate; updates on resize).
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
