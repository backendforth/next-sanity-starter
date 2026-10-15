import { type RefObject, useLayoutEffect, useRef, useState } from "react";

/**
 * Tracks the container’s CSS pixel width and height. The first measurement runs in a layout
 * effect, so consumers see real dimensions on the next render pass, before paint —
 * `MediaVideoLoop` gates its single HLS attach on these values. SSR markup is unaffected
 * (state starts `undefined` on server and client).
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

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;

		const measure = () => {
			const rect = el.getBoundingClientRect();
			if (rect.width > 0) setWidthPx(Math.ceil(rect.width));
			if (rect.height > 0) setHeightPx(Math.ceil(rect.height));
		};

		measure();

		/* Re-measure with the same `getBoundingClientRect` box instead of the observer's
		 * `contentRect` (which excludes padding and ignores transforms), so the first observer
		 * callback reports the same size and doesn't flip a consumer's derived URL. */
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	return [ref, widthPx, heightPx];
}
